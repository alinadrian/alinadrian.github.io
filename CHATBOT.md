# Local site assistant

The portfolio includes a small browser-based assistant that answers questions from information already published on the website.

## Files

- `chatbot.js` — search, ranking, conversation context and interface behavior
- `chatbot-data.js` — curated profile and interface data
- `chatbot-site-index.js` — searchable index built from the public pages
- `chatbot.css` — assistant interface styles

## Behavior

The assistant follows the language selected on the website and searches the corresponding public content. It supports simple follow-up questions, typo tolerance and links back to relevant source pages.

The conversation history is stored in `sessionStorage` for the current browser session. The site does not need a separate backend for the assistant.

When the site is opened from the public domain, the browser can refresh the searchable content from same-origin public pages. When opened locally, the bundled index is used.
