```bash
docker build --load -t chat-agent-web:0.1.1 -t chat-agent-web:latest .
docker save -o dist/chat-agent-web-0.1.1-20260924-115908.tar chat-agent-web:0.1.1 chat-agent-web:latest
```
