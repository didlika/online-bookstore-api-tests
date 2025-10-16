import { test, expect } from "@playwright/test";
import { ApiRequests } from "../../utils/apiRequests";
import { createBook, randomBook } from "../../utils/dataGenerator";
import {
  PATH_BOOKS,
  STATUS_OK,
  STATUS_CREATED,
  STATUS_BAD_REQUEST,
  STATUS_NOT_FOUND,
  STATUS_CONFLICT,
  STATUS_UNPROCESSABLE,
  NON_EXISTING_BOOK_ID,
  NEGATIVE_ID,
  MAX_TITLE_LENGTH,
  OVERFLOW_TITLE_LENGTH,
  LARGE_PAGE_COUNT,
  MAX_SAFE_PAGE_COUNT,
  NEGATIVE_PAGE_COUNT,
  DEFAULT_PAGE_COUNT,
  IDEMPOTENT_TITLE,
  MULTI_FIELD_UPDATE_TITLE,
  UPDATED_DESCRIPTION,
  UPDATED_EXCERPT,
  TITLE_SUFFIX_UPDATED,
  TITLE_SUFFIX_CHANGED,
  TITLE_NON_EXISTENT,
  TITLE_ID_MISMATCH,
  EXTRA_FIELD_KEY,
  EXTRA_FIELD_VALUE,
  INVALID_DATE,
  INVALID_PAGE_COUNT_STRING,
  INVALID_TITLE_NUMBER,
  TEST_CHAR_T,
  TEST_CHAR_X,
  EMPTY_STRING,
  INVALID_ID_STRING,
} from "../../fixtures/testConstants";

test.describe("Books PUT API", () => {
  let api: ApiRequests;
  let existingBook: any;

  test.beforeAll(async ({ baseURL }) => {
    api = new ApiRequests(baseURL!);
    await api.init();
    existingBook = await randomBook(api);
  });

  test.afterAll(async () => {
    await api.close();
  });

  test.describe("PUT /api/v1/Books/{id}", () => {
    test("should update existing book title", async () => {
      const updatedBook = {
        ...existingBook,
        title: existingBook.title + TITLE_SUFFIX_UPDATED,
      };

      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        updatedBook,
      );

      expect(response.status()).toBe(STATUS_OK);

      const returnedBook = await response.json();
      expect(returnedBook.id).toBe(existingBook.id);
      expect(returnedBook.title).toBe(updatedBook.title);
    });

    test("should update multiple fields simultaneously", async () => {
      const updatedBook = {
        ...existingBook,
        title: MULTI_FIELD_UPDATE_TITLE,
        description: UPDATED_DESCRIPTION,
        pageCount: (existingBook.pageCount || DEFAULT_PAGE_COUNT) + 1,
        excerpt: UPDATED_EXCERPT,
      };

      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        updatedBook,
      );

      expect(response.status()).toBe(STATUS_OK);

      const returnedBook = await response.json();
      expect(returnedBook.title).toBe(updatedBook.title);
      expect(returnedBook.description).toBe(updatedBook.description);
      expect(returnedBook.pageCount).toBe(updatedBook.pageCount);
      expect(returnedBook.excerpt).toBe(updatedBook.excerpt);
    });

    test("should accept update with unchanged publish date", async () => {
      const updatedBook = { ...existingBook };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        updatedBook,
      );

      expect(response.status()).toBe(STATUS_OK);
    });

    test("should accept update with new valid publish date", async () => {
      const updatedBook = {
        ...existingBook,
        publishDate: new Date().toISOString(),
      };

      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        updatedBook,
      );

      expect(response.status()).toBe(STATUS_OK);
    });

    test("should return consistent data for repeated identical PUT requests", async () => {
      const updatedBook = { ...existingBook, title: IDEMPOTENT_TITLE };

      const response1 = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        updatedBook,
      );
      const response2 = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        updatedBook,
      );

      expect(response1.status()).toBe(STATUS_OK);
      expect(response2.status()).toBe(STATUS_OK);

      const returnedBook1 = await response1.json();
      const returnedBook2 = await response2.json();

      expect(returnedBook1.title).toBe(returnedBook2.title);
      expect(returnedBook1).toEqual(returnedBook2);
    });

    test("should accept update with large page count", async () => {
      const updatedBook = { ...existingBook, pageCount: LARGE_PAGE_COUNT };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        updatedBook,
      );

      expect(response.status()).toBe(STATUS_OK);
    });

    test("should accept title at maximum length of 255 characters", async () => {
      const updatedBook = {
        ...existingBook,
        title: TEST_CHAR_T.repeat(MAX_TITLE_LENGTH),
      };

      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        updatedBook,
      );

      expect(response.status()).toBe(STATUS_OK);

      const returnedBook = await response.json();
      expect(returnedBook.title.length).toBe(MAX_TITLE_LENGTH);
    });

    test("should return 404 when updating non-existing book", async () => {
      const nonExistingBook = {
        ...existingBook,
        id: NON_EXISTING_BOOK_ID,
        title: TITLE_NON_EXISTENT,
      };
      const response = await api.put(
        `${PATH_BOOKS}/${NON_EXISTING_BOOK_ID}`,
        nonExistingBook,
      );

      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });

    test("should create book via POST then update it via PUT", async () => {
      const newBook = createBook();

      const createResponse = await api.post(PATH_BOOKS, newBook);
      expect([STATUS_OK, STATUS_CREATED]).toContain(createResponse.status());

      const updatedBook = {
        ...newBook,
        title: newBook.title + TITLE_SUFFIX_CHANGED,
      };
      const updateResponse = await api.put(
        `${PATH_BOOKS}/${newBook.id}`,
        updatedBook,
      );

      expect(updateResponse.status()).toBe(STATUS_OK);

      const returnedBook = await updateResponse.json();
      expect(returnedBook.title).toBe(updatedBook.title);
    });

    test("should return 400 or 422 for missing id", async () => {
      const invalidBook = { ...existingBook };
      delete invalidBook.id;

      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        invalidBook,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    // this one is logical to check from business perspective, however api definition allows title to be null, so this test might not be needed
    test("should return 400 or 422 for empty title", async () => {
      const invalidBook = { ...existingBook, title: EMPTY_STRING };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        invalidBook,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    // best practice if storing in db with varchar255, not necessary by api specification
    test("should return 400 or 422 for title exceeding 255 characters", async () => {
      const invalidBook = {
        ...existingBook,
        title: TEST_CHAR_X.repeat(OVERFLOW_TITLE_LENGTH),
      };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        invalidBook,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for non-string title", async () => {
      const invalidBook: any = { ...existingBook, title: INVALID_TITLE_NUMBER };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        invalidBook,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for negative page count", async () => {
      const invalidBook = { ...existingBook, pageCount: NEGATIVE_PAGE_COUNT };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        invalidBook,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for non-numeric page count", async () => {
      const invalidBook: any = {
        ...existingBook,
        pageCount: INVALID_PAGE_COUNT_STRING,
      };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        invalidBook,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for invalid publish date format", async () => {
      const invalidBook = { ...existingBook, publishDate: INVALID_DATE };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        invalidBook,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 409 when ID in path differs from ID in body", async () => {
      const invalidBook = {
        ...existingBook,
        id: existingBook.id + 1,
        title: TITLE_ID_MISMATCH,
      };

      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        invalidBook,
      );

      expect([STATUS_BAD_REQUEST, STATUS_CONFLICT]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for null description", async () => {
      const invalidBook = { ...existingBook, description: null };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        invalidBook,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for empty request body", async () => {
      const response = await api.put(`${PATH_BOOKS}/${existingBook.id}`, {});

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 404 for negative ID in path", async () => {
      const payload = { ...existingBook, id: NEGATIVE_ID };
      const response = await api.put(`${PATH_BOOKS}/${NEGATIVE_ID}`, payload);

      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 404 for non-numeric ID in path", async () => {
      const payload = { ...existingBook, id: INVALID_ID_STRING };
      const response = await api.put(
        `${PATH_BOOKS}/${INVALID_ID_STRING}`,
        payload as any,
      );

      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should handle excessive page count overflow", async () => {
      const invalidBook = {
        ...existingBook,
        pageCount: MAX_SAFE_PAGE_COUNT,
      };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        invalidBook,
      );

      expect([STATUS_OK, STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should handle or reject unexpected extra field", async () => {
      const modifiedBook: any = {
        ...existingBook,
        [EXTRA_FIELD_KEY]: EXTRA_FIELD_VALUE,
      };
      const response = await api.put(
        `${PATH_BOOKS}/${existingBook.id}`,
        modifiedBook,
      );

      expect([STATUS_OK, STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });
  });
});
