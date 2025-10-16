// API paths
export const PATH_BOOKS = "/Books";
export const PATH_AUTHORS = "/Authors";
export const PATH_INVALID = "/Bookz";
export const PATH_INVALID_AUTHORS = "/Authorz";

// HTTP status codes
export const STATUS_OK = 200;
export const STATUS_CREATED = 201;
export const STATUS_NO_CONTENT = 204;
export const STATUS_BAD_REQUEST = 400;
export const STATUS_NOT_FOUND = 404;
export const STATUS_METHOD_NOT_ALLOWED = 405;
export const STATUS_CONFLICT = 409;
export const STATUS_GONE = 410;
export const STATUS_UNPROCESSABLE = 422;

// Test IDs
export const NON_EXISTING_BOOK_ID = 999999;
export const NON_EXISTING_AUTHOR_ID = 999999;
export const NEGATIVE_ID = -1;
export const ZERO_ID = 0;
export const INVALID_ID_STRING = "abc";
export const ENCODED_SPACE_ID = "%20";
export const INT32_MAX_OVERFLOW = 2147483648;

// Title constraints
export const MAX_TITLE_LENGTH = 255;
export const OVERFLOW_TITLE_LENGTH = MAX_TITLE_LENGTH + 1;
export const EMPTY_STRING = "";

// Name constraints (for Authors)
export const MAX_NAME_LENGTH = 255;
export const OVERFLOW_NAME_LENGTH = MAX_NAME_LENGTH + 1;

// Page count constraints
export const LARGE_PAGE_COUNT = 999999;
export const MAX_SAFE_PAGE_COUNT = Number.MAX_SAFE_INTEGER;
export const NEGATIVE_PAGE_COUNT = -10;
export const DEFAULT_PAGE_COUNT = 100;

// Book ID constraints (for Author references)
export const LARGE_BOOK_ID = 999999;
export const VALID_BOOK_ID = 1;
export const DEFAULT_BOOK_ID = 100;

// Test data strings - Books
export const IDEMPOTENT_TITLE = "Idempotent Title";
export const MULTI_FIELD_UPDATE_TITLE = "Multi Field Update";
export const UPDATED_DESCRIPTION = "Updated description";
export const UPDATED_EXCERPT = "Updated excerpt";
export const TITLE_SUFFIX_UPDATED = " Updated";
export const TITLE_SUFFIX_CHANGED = " Changed";
export const TITLE_NON_EXISTENT = "Non-existent";
export const TITLE_ID_MISMATCH = "ID Mismatch";

// Test data strings - Authors
export const IDEMPOTENT_FIRST_NAME = "Idempotent FirstName";
export const UPDATED_FIRST_NAME = "Updated FirstName";
export const UPDATED_LAST_NAME = "Updated LastName";
export const FIRST_NAME_SUFFIX_UPDATED = " Updated";
export const FIRST_NAME_NON_EXISTENT = "Non-existent";

// Field names and values
export const EXTRA_FIELD_KEY = "extraField";
export const EXTRA_FIELD_VALUE = "extra";

// Invalid values
export const INVALID_DATE = "not-a-date";
export const INVALID_PAGE_COUNT_STRING = "NaN";
export const INVALID_TITLE_NUMBER = 12345;
export const INVALID_FIRST_NAME_NUMBER = 12345;
export const INVALID_LAST_NAME_NUMBER = 67890;
export const INVALID_ID_BOOK_STRING = "invalid";

// Repeat counts for boundary testing
export const TEST_CHAR_T = "T";
export const TEST_CHAR_X = "X";
export const TEST_CHAR_F = "F";
export const TEST_CHAR_L = "L";

// Path segments
export const EXTRA_PATH_SEGMENT = "/extra";

// Minimal test strings
export const MINIMAL_STRING_A = "A";
export const MINIMAL_STRING_B = "B";
