const creds = require('../credentials.json')
const token = creds.slackApiKey

const { WebClient } = require('@slack/web-api');
const web = new WebClient(token);

const generateMessageBlocks = (messages) => {
    return messages.map(message => ({
            "type": "section",
            "block_id": `message-block-${message.ts}`,
            "text": {
                "type": "mrkdwn",
                "text": message.text
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "exclude",
                    "emoji": true
                },
                "value": message.ts
            }
        })
    )
}

const generateSpaceSelects = spaces => spaces.map(space => ({
        "text": {
            "type": "plain_text",
            "text": space.name,
            "emoji": true
        },
        "value": space.key
}))

const generateBaseModal = ({metadata, messages, spaces}) => ({
    "type": "modal",
    "callback_id": "message_modal",
    "private_metadata": metadata,
    "title": {
        "type": "plain_text",
        "text": "Convo to Confluence",
        "emoji": true
    },
    "submit": {
        "type": "plain_text",
        "text": "Create Draft Article",
        "emoji": true
    },
    "close": {
        "type": "plain_text",
        "text": "Cancel",
        "emoji": true
    },
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "Create a Confluence Article from your selected conversation."
            }
        },
        {
            "type": "input",
            "block_id": "title_input",
            "element": {
                "action_id": "title_input",
                "type": "plain_text_input",
                "placeholder": {
					"type": "plain_text",
					"text": "Give it a title",
					"emoji": true
				},
            },
            "label": {
                "type": "plain_text",
                "text": "What is this conversation about?",
                "emoji": true
            }
        },
        {
            "type": "input",
            "block_id": "space_select",
			"element": {
                "type": "static_select",
                "action_id": "space_select",
				"placeholder": {
					"type": "plain_text",
					"text": "Select a space",
					"emoji": true
				},
				"options": generateSpaceSelects(spaces)
			},
			"label": {
				"type": "plain_text",
				"text": "Select the Space to create this article in",
				"emoji": true
			}
		},
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Select messages to include in your Article*"
            }
        },
        {
			"type": "actions",
			"elements": [
				{
                    "type": "button",
                    "action_id": "exclude_all",
					"text": {
						"type": "plain_text",
						"text": "Exclude All",
						"emoji": true
					},
					"value": "exclude_all"
				},
				{
                    "type": "button",
                    "action_id": "include_all",
					"text": {
						"type": "plain_text",
						"text": "Include All",
						"emoji": true
					},
					"value": "include_all"
				}
			]
		},
        ...generateMessageBlocks(messages)
    ]
})

async function enrichThreads ({ threadTs, channelId }) {
    async function getMessages(messages, cursor) {
        const payload = {
            channel: channelId,
            ts: threadTs,
            limit: 100
        }
        
        if (cursor != null) {
            payload.cursor = cursor
        }

        const result = await web.apiCall('conversations.replies', payload)
        const newMessages = [...messages, ...result.messages]

        if (result.has_more && allMessages.length < 100) {
            return await getMessages(newMessages, result.response_metadata.next_cursor)
        }

        return newMessages
    }

    return await getMessages([])
}

async function enrichBetweenMessages({ channelId, startTs, endTs }) {

    async function getMessages(messages, cursor) {
        const payload = {
            channel: channelId,
            oldest: startTs,
            latest: endTs,
            inclusive: true,
            limit: 200
         }
        
        if (cursor != null) {
            payload.cursor = cursor
        }

        const result = await web.apiCall('conversations.history', payload)
        const newMessages = [...messages, ...result.messages]

        if (result.has_more && allMessages.length < 500) {
            return await getMessages(newMessages, result.response_metadata.next_cursor)
        }

        return newMessages.reverse()
    }

     return await getMessages([])
}

async function openModal(trigger, viewData) {
    const modalView = generateBaseModal(viewData)

    const result = await web.views.open({
        trigger_id: trigger,
        view: modalView
    })
    
      // The result contains an identifier for the root view, view.id
      console.log(`Successfully opened root view ${result.view.id}`, result);
}

async function updateModal(viewId, view) {
    web.apiCall('views.update', { view, view_id: viewId })
}

module.exports = {
    enrichThreads,
    enrichBetweenMessages,
    openModal,
    updateModal
}