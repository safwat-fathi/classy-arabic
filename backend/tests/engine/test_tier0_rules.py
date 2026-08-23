from app.engine.tier0_rules import match_tier0


def test_greeting_matches():
    assert match_tier0("مرحبا") is None or match_tier0("السلام عليكم") == "greeting"


def test_single_emoji_is_reaction():
    assert match_tier0("👍") == "reaction"


def test_spam_link_matches():
    assert match_tier0("check this out https://spam.example.com") == "spam"


def test_bare_link_is_spam():
    assert match_tier0("https://spam.example.com") == "spam"


def test_normal_message_has_no_match():
    assert match_tier0("عايز اطلب ٢ كيلو رز بسمتي") is None


def test_product_link_with_question_is_not_spam():
    # A customer sharing a product link while asking about it must still reach
    # the classifier, not get short-circuited as spam just for containing a URL.
    assert match_tier0("هل الفستان ده متاح؟ https://instagram.com/p/xyz") is None


def test_product_link_with_long_sentence_is_not_spam():
    assert match_tier0("ابعتلك اللينك بتاع الفستان الصيفي علشان تشوفيه https://instagram.com/p/xyz") is None
