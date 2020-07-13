const { createMessageAdapter } = require('@slack/interactive-messages');
const slackWebApi = require('./slack-web')
const confluence = require('./confluence')
const escape = require('escape-html')
const creds = require('../credentials.json')

let slackInteractions 

const cache = {}


function init(){
    const slackSigningSecret = creds.slackSigningSecret
    slackInteractions = createMessageAdapter(slackSigningSecret);
}

function registerEvents() {
    slackInteractions.action({ type: 'message_action' }, (payload, respond) => {
        console.log('payload action for mesage stuff', payload)
        const channelId = payload.channel.id
        const messageTs = payload.message.ts
        const threadTs = payload.message.thread_ts
        const triggerId = payload.trigger_id
        const userId = payload.user.id
        const companyDomain = payload.team.domain
        let enrichMessagesPromise
        let slaveAchiveLink
        
        const createSlackArchiveLink = (timestamp) => {
            const newTimestamp = `p${timestamp.replace('.', '')}`
            return `https://${companyDomain}.slack.com/archives/${channelId}/${newTimestamp}`
        }
    
        // end of message selection
        if (cache[userId] && cache[userId].channelId === channelId) {
            console.log('finish the regular message selection')
            enrichMessagesPromise = slackWebApi.enrichBetweenMessages({
                channelId,
                startTs: cache[userId].startTs,
                endTs: messageTs
            })

            slackArchiveLink = createSlackArchiveLink(cache[userId].startTs)

            delete cache[userId]
            
        }

        // beginning of message selection
        // Basically if we're not the root messages of thread, force the user to select an ending message
        else if (threadTs == null) {
            respond({ text: 'Starting message selected! Please select the end message to finish creating your confluence page', response_type: 'ephemeral' });

            // save data in cache ( should be in database... )
            cache[userId] = {
                channelId,
                startTs: messageTs
            }
            return
        } else {
            slackArchiveLink = createSlackArchiveLink(messageTs)
            enrichMessagesPromise = slackWebApi.enrichThreads({
                threadTs,
                channelId
            })
        }

        // Modal time, let's get the messages and confluences spaces so we can get the show on the road
        const getSpacesPromise = confluence.getSpaces(creds.clientKey)
        
        Promise.all([enrichMessagesPromise, getSpacesPromise]).then(([messages, spaces]) => {
            // todo - if we weren't able to get the messages from slack (improper permissions), then we need to request user permissions.
            const metadata = JSON.stringify({
                slackArchiveLink,
                channelName: payload.channel.name
            })

            const viewData = {
                metadata,
                messages,
                spaces
            }

            slackWebApi.openModal(triggerId, viewData)
        })
    })

    slackInteractions.action({ type: 'button' }, (payload, response) => {
        console.log('button press', payload)
        const view = payload.view
        const action = payload.actions[0]
        const messageBlocks = payload.view.blocks.filter(block => block.block_id.startsWith('message-block'))

        const changeBlock = block => {
            const currentButtonText = block.accessory.text.text
            const currentText = block.text.text

            const newText = currentButtonText === "exclude"
            ? `~${currentText}~`
            : currentText.substring(1, currentText.length - 1)

            const newButtonText = currentButtonText === "exclude"
                ? 'include'
                : 'exclude'

            block.text.text = newText
            block.accessory.text.text = newButtonText
        }

        const stripExtraViewFields = view => {
            const {
                id, team_id, state, hash, previous_view_id, root_view_id, app_id,
                app_installed_team_id, bot_id,
                ...newView
            } = view

            return newView
        }

        if (action.action_id === 'include_all') {
            messageBlocks.filter(block => block.accessory.text.text === 'include')
                .map(changeBlock)

        } else if (action.action_id === 'exclude_all') {
            messageBlocks.filter(block => block.accessory.text.text === 'exclude')
                .map(changeBlock)
        } else {
            // regular button press on a single message
            const actionBlock = payload.view.blocks.find(block => block.block_id === action.block_id)
            changeBlock(actionBlock)
        }
        
        const newView = stripExtraViewFields(view)
        slackWebApi.updateModal(view.id, newView)
    })

    slackInteractions.viewSubmission('message_modal', (payload) => {
        console.log('submission payload', payload)

        const subValues = payload.view.state.values
        const articleTitle = subValues.title_input.title_input.value
        const articleSpaceKey = subValues.space_select.space_select.selected_option.value
        const {slackArchiveLink, channelName } = JSON.parse(payload.view.private_metadata)

        const messagesToSave = payload.view.blocks
            .filter(block => block.block_id.startsWith('message-block'))
            .filter(block => block.accessory.text.text === 'exclude')
            .map(block => block.text.text)

        const formattedMessages = messagesToSave
            .map(message => escape(message))
            .map(message => `<p>${message}</p>`)

        const createBody = () => `
<h1>${articleTitle}</h1>
${formattedMessages.join('\n')}
<h3>Details</h3>
<p>Conversation created from ${channelName}. <a href="${slackArchiveLink}">👉 Click here</a> to view the original conversation.</p>
`
        const pageData = {
            title: articleTitle,
            type: 'page',
            space: {
                key: articleSpaceKey
            },
            body: {
                "storage": {
                    "value": createBody(),
                    "representation": "storage"
                }
            }
        }

        confluence.createPage(creds.clientKey, pageData)
    })
}

module.exports = function(app) {
    init()
    registerEvents()
    app.use('/slack-events', slackInteractions.requestListener());
}