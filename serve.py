# Local test server with SPA fallback:  python serve.py 8080   ->  http://localhost:8080
import http.server, os, sys
class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        p=self.translate_path(self.path.split('?')[0])
        if not os.path.exists(p) or os.path.isdir(p) and not os.path.exists(os.path.join(p,'index.html')):
            self.path='/index.html'
        return super().send_head()
    def log_message(self,*a): pass
http.server.test(HandlerClass=H, port=int(sys.argv[1]) if len(sys.argv)>1 else 8080)
