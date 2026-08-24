import re

GREETING_PATTERN = re.compile(
    r"^\s*(hi|hello|hey|السلام عليكم|أهلا|اهلا|صباح الخير|مساء الخير)\s*[!.،؟]*\s*$",
    re.IGNORECASE,
)
SPAM_PATTERN = re.compile(r"(http[s]?://|www\.)\S+", re.IGNORECASE)
SINGLE_EMOJI_PATTERN = re.compile(r"^[\U0001F300-\U0001FAFF☀-➿]{1,3}$")
# A URL alone (or with only a couple of stray filler words) is spam. A URL
# inside a real question — "هل الفستان ده متاح؟ https://..." — is a customer
# sharing a product link, not spam; that message must still reach the
# classifier. Two independent guards, either one is enough to clear it:
# a question mark in the remaining text, or the remainder simply being long
# (a real sentence, not filler around a link).
SPAM_REMAINDER_MAX_CHARS = 20


def match_tier0(normalized_text: str) -> str | None:
    text = normalized_text.strip()
    if not text:
        return None
    if SINGLE_EMOJI_PATTERN.match(text):
        return "reaction"
    if GREETING_PATTERN.match(text):
        return "greeting"
    if SPAM_PATTERN.search(text):
        url_stripped = SPAM_PATTERN.sub("", text).strip()
        has_question = "?" in url_stripped or "؟" in url_stripped
        remainder = url_stripped.strip(" \t\n.,!،-")
        if not has_question and len(remainder) <= SPAM_REMAINDER_MAX_CHARS:
            return "spam"
    return None
