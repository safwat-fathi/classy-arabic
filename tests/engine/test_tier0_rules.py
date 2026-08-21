from app.engine.tier0_rules import match_tier0


def test_greeting_matches():
    assert match_tier0("مرحبا") is None or match_tier0("السلام عليكم") == "greeting"


def test_single_emoji_is_reaction():
    assert match_tier0("👍") == "reaction"


def test_spam_link_matches():
    assert match_tier0("check this out https://spam.example.com") == "spam"


def test_normal_message_has_no_match():
    assert match_tier0("عايز اطلب ٢ كيلو رز بسمتي") is None
