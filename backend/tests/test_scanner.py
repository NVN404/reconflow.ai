from app.services.phase1_domain import Phase1DomainScanner
from app.cache import get_cached_scan

def test_cache_fallback():
    scanner = Phase1DomainScanner(api_key="")
    # Should hit demo_mock.json for demo-sandbox.corp
    result = scanner.scan("demo-sandbox.corp", use_cache=True)
    assert result.summary.target == "demo-sandbox.corp"
    assert len(result.nodes) > 0
    assert len(result.edges) > 0
    assert result.summary.critical_risks >= 1

def test_simulated_scan():
    scanner = Phase1DomainScanner(api_key="")
    # For any new domain without API key, should generate deterministic scan
    result = scanner.scan("example.com", use_cache=False)
    assert result.summary.target == "example.com"
    assert len(result.nodes) >= 4
    assert result.summary.security_grade in ["A", "B", "C", "D", "F"]

if __name__ == "__main__":
    test_cache_fallback()
    test_simulated_scan()
    print("All backend scanner tests passed successfully!")
