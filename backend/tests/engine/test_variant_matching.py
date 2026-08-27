from app.engine.product_matching import VariantCandidate, match_variant_hint


def test_match_variant_hint_matches_label_case_insensitive():
    candidates = [VariantCandidate(id="v1", label="XL", attributes={})]
    assert match_variant_hint("xl", candidates) == "v1"


def test_match_variant_hint_matches_attribute_value():
    candidates = [
        VariantCandidate(id="v1", label="M / Blue", attributes={"color": "الأسود"}),
    ]
    assert match_variant_hint("الأسود", candidates) == "v1"


def test_match_variant_hint_returns_none_when_no_hint():
    candidates = [VariantCandidate(id="v1", label="XL", attributes={})]
    assert match_variant_hint(None, candidates) is None
    # An empty-string hint must not fall through to the substring check -
    # "" is a substring of every label/attribute, which would otherwise
    # silently match the first candidate every time.
    assert match_variant_hint("", candidates) is None


def test_match_variant_hint_returns_none_when_no_candidates():
    assert match_variant_hint("XL", []) is None


def test_match_variant_hint_returns_none_when_nothing_matches():
    candidates = [VariantCandidate(id="v1", label="Small", attributes={"color": "Red"})]
    assert match_variant_hint("XL", candidates) is None


def test_match_variant_hint_returns_first_match_when_ambiguous():
    candidates = [
        VariantCandidate(id="v1", label="XL / Red", attributes={}),
        VariantCandidate(id="v2", label="XL / Blue", attributes={}),
    ]
    assert match_variant_hint("XL", candidates) == "v1"
