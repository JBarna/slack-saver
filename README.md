## Inspiration
Slack is an amazing tool, and if you've ever used it at your company then you know just how much information goes through it: Daily updates, company-wide discussion threads, analysis and critique of work, and regular plain team communication call Slack their home. 

**Occasionally, a really great conversation comes through.** 

Maybe it's a detailed answer to an on-boarding question, or an inspiring exchange about the company's vision. These gems shine through at the most unexpected times and they are truly valuable and worthy to be saved and shared. 

**Because everything is written down in Slack, that makes it easy to share, right?**

Wrong. Because Slack serves as a home for so many routine and ordinary conversations, the valuable highlights that stand out from the pack cannot be isolated and shared in an effective way. How many times have you thought to yourself "I answered this question a month ago", and went searching through Slack only to get lost in the myriad of previous messages.

**The problem isn't Slack. Slack better serves as a medium of transfer, not as storage.**

That's where Confluence comes in. For years we've been using Confluence as the storage and reference place for memos, instructions, articles, blogs, and other types of more-thoughtful and valuable content than just ordinary conversation.

**So why not copy a conversation and paste it in Confluence?**

Believe it or not, you cannot just copy and paste a conversation from Slack into Confluence with your keyboard and mouse. It brings along people's names, timestamps, face picture, and horrendous formatting that completes ruins the effort of saving the conversation. Even if you could copy + paste a conversation, not all the messages are valuable. Within a 30 message thread, maybe 15 of those are insightful, the rest simple comments that don't deserve to be saved.

**That's where Slack Saver comes in.**

Slack Saver allows you to *flexibly* select a range of messages that you want to save and seamlessly create a Confluence Article in your selected space, with a title that matches the context of the conversation. It's an incredibly simple yet valuable tool that we are going to use constantly throughout our workday.

## How I built it
I used the Node.js ACE SDK/Library along side the Slack Node.js SDK. It took quite a while to figure out all the nuances with the ACE framework but it was very helpful as I did not have to implement the authorization framework.

## Challenges I ran into
A lot of time was spent trying to figure out small, indiscoverable issues. I was using the `httpClient` to interact with the Confluence REST API and kept getting `403` forbidden. After hours of looking, I saw that the `httpClient` was an extension of the `requests` library and used the flag `NODE_DEBUG=request`, which after I finally saw some debugging output that helped me understand what the issue was.

Another challenge with Slack is that conversations can happen in so many different places - direct messages, private channels. They can happen in Threads or in regular messages, or a mix of both. So I had to build the system to be flexible enough to handle the variety of use cases so that the tool would actually be usable.

## Accomplishments that I'm proud of
We literally use this constantly at work so I am very happy that we built it. It took a lot of work and I'm happy that people at work are using it daily.

## What I learned
SDK's are amazing. The ACE library does a lot of heavy lifting for you. Same with the Slack SDKs. Remember to look at the tools underneath the SDk, and that can help you debug issues and move faster.

## What's next for Slack Saver
We would love to build this for Microsoft Teams and other workspace chat tools because we are sure the same issues exist with valuable messages being lost. We don't use those platforms but if people would be willing to pay a small subscription fee, we'd be willing to make it.


# How to run it
1. Download the source code
2. Create a Slack App for your organization
3. Add 1) your confluence client-key to the config file under `clientKey`, 2) your slack API key under `slackApiKey` and 3) add your slack signing secret under `slackSigningSecret` to the `config.json` file, along with your regular host information. 

