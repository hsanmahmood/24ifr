import json
import pytest
from backend.app import app as flask_app

class FakeResp:
    def __init__(self, data=None, error=None):
        self.data = data
        self.error = error

class FakeRPC:
    def __init__(self, ret):
        self.ret = ret
    def execute(self):
        return FakeResp(self.ret, None)

class FakeFrom:
    def __init__(self, table, ret):
        self.table = table
        self.ret = ret
        self._gte_field = None
        self._gte_value = None
    def select(self, *args, **kwargs):
        return self
    def gte(self, field, val):
        self._gte_field = field
        self._gte_value = val
        return self
    def execute(self):
        return FakeResp(self.ret, None)

class FakeSupabase:
    def __init__(self, per_day=None, last7=None, last30=None, growth=None):
        # per_day/last7/last30 are lists of {'date':..., 'count':...}
        # convert them to created_at rows for clearance_generations queries
        self._per_day = per_day or []
        self._last7 = last7 or []
        self._last30 = last30 or []
        self._growth = growth or []
    def rpc(self, name, params=None):
        if name == 'get_admin_users':
            # convert growth rows to created_at format
            rows = []
            for r in self._growth:
                rows.append({'created_at': r.get('date')})
            return FakeRPC(rows)
        return FakeRPC([])
    def from_(self, table):
        if table == 'clearance_generations':
            # choose an appropriate dataset depending on what's expected in the tests
            # use _per_day as the base for per-day queries
            rows = []
            for r in self._per_day:
                rows.append({'created_at': r.get('date')})
            return FakeFrom(table, rows)
        if table == 'users':
            rows = []
            for r in self._growth:
                rows.append({'created_at': r.get('date')})
            return FakeFrom(table, rows)
        return FakeFrom(table, [])

@pytest.fixture
def client(monkeypatch):
    from backend.app import api
    fake = FakeSupabase(
        per_day=[{'date':'2026-05-01','count':5},{'date':'2026-05-02','count':3}],
        last7=[{'date':'2026-05-10','count':2}]*7,
        last30=[{'date':'2026-04-18','count':1}]*30,
        growth=[{'date':'2026-04-01','count':10},{'date':'2026-05-01','count':20}]
    )
    monkeypatch.setattr(api, 'supabase', fake)
    flask_app.config['TESTING'] = True
    # In tests, ensure cookie domain doesn't prevent session cookies
    flask_app.config['SESSION_COOKIE_DOMAIN'] = None
    with flask_app.test_client() as c:
        with c.session_transaction() as sess:
            sess['user'] = {'id': 1, 'is_admin': True}
        yield c

def test_clearances_per_day(client):
    resp = client.get('/api/admin/analytics/clearances-per-day')
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert isinstance(data, list)

def test_clearances_last_7_days(client):
    resp = client.get('/api/admin/analytics/clearances-last-7-days')
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert isinstance(data, list)
    assert len(data) == 7

def test_clearances_last_30_days(client):
    resp = client.get('/api/admin/analytics/clearances-last-30-days')
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert isinstance(data, list)
    assert len(data) == 30

def test_user_growth(client):
    resp = client.get('/api/admin/analytics/user-growth')
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert isinstance(data, list)
    # should be ascending by date and cumulative
    dates = [r['date'] for r in data]
    assert dates == sorted(dates)
    counts = [r['count'] for r in data]
    assert all(isinstance(c, int) for c in counts)
    assert all(counts[i] <= counts[i+1] for i in range(len(counts)-1))

def test_protection_requires_admin(monkeypatch):
    # replace supabase with no-op to ensure auth fails first
    from backend.app import api
    monkeypatch.setattr(api, 'supabase', FakeSupabase())
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as c:
        # no session: should be 401
        resp = c.get('/api/admin/analytics/user-growth')
        assert resp.status_code == 401
        # non-admin session
        with c.session_transaction() as sess:
            sess['user'] = {'id':2, 'is_admin': False}
        resp2 = c.get('/api/admin/analytics/user-growth')
        assert resp2.status_code == 403
