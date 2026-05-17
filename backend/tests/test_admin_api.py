import json
import pytest
from backend.app import app as flask_app

class FakeResp:
    def __init__(self, data=None, error=None):
        self.data = data
        self.error = error

class FakeFrom:
    def __init__(self, table, ret):
        self.table = table
        self.ret = ret
    def select(self, *args, **kwargs):
        return self
    def execute(self):
        return FakeResp(self.ret, None)
    def upsert(self, payload, on_conflict=None):
        # emulate chainable API where upsert(...).execute() returns response
        self.ret = [payload]
        return self

class FakeRPC:
    def __init__(self, ret):
        self.ret = ret
    def execute(self):
        return FakeResp(self.ret, None)

class FakeSupabase:
    def __init__(self, docs=None, daily=None, growth=None):
        self._docs = docs or []
        self._daily = daily or []
        self._growth = growth or []
    def from_(self, table):
        if table == 'admin_documents':
            return FakeFrom(table, self._docs)
        return FakeFrom(table, [])
    def rpc(self, name, params=None):
        if name == 'admin_clearances_daily':
            return FakeRPC(self._daily)
        if name == 'admin_user_growth':
            return FakeRPC(self._growth)
        return FakeRPC([])

@pytest.fixture
def client(monkeypatch):
    # Patch supabase used by api module
    from backend.app import api
    fake = FakeSupabase(docs=[{'doc_key':'changelog','title':'Ch','content_md':'x'}],
                       daily=[{'date':'2026-05-01','count':1}],
                       growth=[{'date':'2026-05-01','count':2}])
    monkeypatch.setattr(api, 'supabase', fake)
    # Ensure tests see admin session
    flask_app.config['TESTING'] = True
    flask_app.config['SESSION_COOKIE_DOMAIN'] = None
    with flask_app.test_client() as c:
        with c.session_transaction() as sess:
            sess['user'] = {'id': 1, 'is_admin': True}
        yield c

def test_load_admin_documents(client):
    resp = client.get('/api/admin/documents')
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert 'documents' in data
    assert isinstance(data['documents'], list)

def test_save_admin_document(client):
    payload = {'title':'New','content_md':'abc'}
    resp = client.put('/api/admin/documents/testdoc', json=payload)
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data.get('success') is True

def test_load_admin_clearances_daily(client):
    resp = client.get('/api/admin/clearances/daily?days=7')
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert isinstance(data, list)

def test_load_admin_user_growth(client):
    resp = client.get('/api/admin/user-growth?days=30')
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert isinstance(data, list)
