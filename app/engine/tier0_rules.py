import re

GREETING_PATTERN = re.compile(
    r"^\s*(hi|hello|hey|السلام عليكم|أهلا|اهلا|صباح الخير|مساء الخير)\s*[!.،؟]*\s*$",
    re.IGNORECASE,
)
SPAM_PATTERN = re.compile(r"(http[s]?://|www\.)\S+", re.IGNORECASE)
SINGLE_EMOJI_PATTERN = re.compile(r"^[\U0001F300-\U0001FAFF☀-➿]{1,3}$")


def match_tier0(normalized_text: str) -> str | None:
    text = normalized_text.strip()
    if not text:
        return None
    if SINGLE_EMOJI_PATTERN.match(text):
        return "reaction"
    if GREETING_PATTERN.match(text):
        return "greeting"
    if SPAM_PATTERN.search(text):
        return "spam"
    return None
