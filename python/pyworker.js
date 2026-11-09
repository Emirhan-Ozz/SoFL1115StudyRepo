// Öğrenci kodunu ana sayfayı dondurmadan çalıştırır. Sonsuz döngüde ana sayfa bu worker'ı sonlandırır.
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
const ready = loadPyodide();
const RUNNER = `
import sys, io
_buf = io.StringIO()
_q = list(_inp)
def _input(prompt=''):
    if not _q:
        raise EOFError("input() beklenenden fazla çağrıldı")
    return _q.pop(0)
_old = sys.stdout
sys.stdout = _buf
_err = ''
try:
    exec(compile(_code, '<kodun>', 'exec'), {'input': _input, '__name__': '__main__'})
except SyntaxError as e:
    _err = f"SyntaxError (satır {e.lineno}): {e.msg}"
except Exception as e:
    _err = type(e).__name__ + ': ' + str(e)
finally:
    sys.stdout = _old
[_buf.getvalue(), _err]
`;
self.onmessage = async (e) => {
  const { id, code, inputs } = e.data;
  try {
    const py = await ready;
    py.globals.set('_code', code);
    py.globals.set('_inp', py.toPy(inputs));
    const r = py.runPython(RUNNER).toJs();
    self.postMessage({ id, out: r[0], err: r[1] });
  } catch (err) {
    self.postMessage({ id, out: '', err: String(err) });
  }
};
self.postMessage({ boot: true });
ready.then(() => self.postMessage({ loaded: true }), err => self.postMessage({ failed: String(err) }));
