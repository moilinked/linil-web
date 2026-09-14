export const CHAT_RELOAD_EVENT = "chat-reload"

export function requestChatReload() {
  window.dispatchEvent(new Event(CHAT_RELOAD_EVENT))
}
