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
        if table == 'site_documents':
            return FakeFrom(table, self._docs)
        if table == 'clearance_generations':
            return FakeFrom(table, self._daily)
        if table == 'users':
            # emulate users table returning created_at rows
            return FakeFrom(table, self._growth)
        return FakeFrom(table, [])
    def rpc(self, name, params=None):
        if name == 'get_admin_users':
            return FakeRPC(self._growth)
        return FakeRPC([])

@pytest.fixture
def client(monkeypatch):
    # Patch supabase used by api module
    from backend.app import api
    fake = FakeSupabase(docs=[
        {'doc_key':'privacy_terms','title':'Privacy & Terms','content_md':'# Privacy\n\nWe only use your account details and generated clearance activity to run the app, keep your session working, and improve the service. We do not sell personal data.\n\n# Terms\n\nUse this app responsibly. Generated clearances are for simulation and training only, and you are responsible for how you use the information shown here.'},
        {'doc_key':'changelog','title':'Changelog','content_md':'# Changelog\n\n- Version 1.0'},
        {'doc_key':'credits','title':'Credits','content_md':'# Credits\n\nThanks to...'},
        {'doc_key':'support','title':'Support','content_md':'# Support\n\nNeed help?'}
    ],
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
    assert len(data['documents']) == 4
    doc_keys = {d['doc_key'] for d in data['documents']}
    assert doc_keys == {'privacy_terms', 'changelog', 'credits', 'support'}

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
