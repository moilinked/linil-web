```bash
docker build --load -t chat-agent-web:0.1.0 -t chat-agent-web:latest .
docker save -o dist/chat-agent-web.tar chat-agent-web:0.1.0 chat-agent-web:latest
```
