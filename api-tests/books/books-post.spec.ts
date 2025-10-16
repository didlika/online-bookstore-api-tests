import { expect, test } from "@playwright/test";
import { ApiRequests } from "../../utils/apiRequests";
import { createBook } from "../../utils/dataGenerator";
import {
  PATH_BOOKS,
  STATUS_OK,
  STATUS_CREATED,
  STATUS_BAD_REQUEST,
  STATUS_UNPROCESSABLE,
  STATUS_CONFLICT,
  MAX_TITLE_LENGTH,
  OVERFLOW_TITLE_LENGTH,
  LARGE_PAGE_COUNT,
  MAX_SAFE_PAGE_COUNT,
  NEGATIVE_PAGE_COUNT,
  TEST_CHAR_T,
  TEST_CHAR_X,
  INVALID_DATE,
  INVALID_PAGE_COUNT_STRING,
  INVALID_TITLE_NUMBER,
  EXTRA_FIELD_KEY,
  EXTRA_FIELD_VALUE,
} from "../../fixtures/testConstants";

test.describe("Books POST API", () => {
  let api: ApiRequests;

  test.beforeAll(async ({ baseURL }) => {
    api = new ApiRequests(baseURL!);
    await api.init();
  });

  test.afterAll(async () => {
    await api.close();
  });

  test.describe("POST /api/v1/Books", () => {
    test("should create valid book and return correct data", async () => {
      const book = createBook();
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());

      const createdBook = await response.json();
      expect(createdBook.id).toBeDefined();
      expect(typeof createdBook.id).toBe("number");
      expect(createdBook.title).toBe(book.title);
      expect(createdBook.pageCount).toBe(book.pageCount);

      const publishDate = new Date(createdBook.publishDate);
      expect(publishDate.toString()).not.toBe("Invalid Date");
    });

    test("should create multiple books with different IDs", async () => {
      const book1 = createBook();
      const book2 = createBook();

      const response1 = await api.post(PATH_BOOKS, book1);
      const response2 = await api.post(PATH_BOOKS, book2);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response1.status());
      expect([STATUS_OK, STATUS_CREATED]).toContain(response2.status());

      const createdBook1 = await response1.json();
      const createdBook2 = await response2.json();

      expect(createdBook1.id).not.toBe(createdBook2.id);
    });

    test("should accept book with large page count", async () => {
      const book = createBook({ pageCount: LARGE_PAGE_COUNT });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());
    });

    test("should accept title at maximum length of 255 characters", async () => {
      const longTitle = TEST_CHAR_T.repeat(MAX_TITLE_LENGTH);
      const book = createBook({ title: longTitle });

      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());

      const createdBook = await response.json();
      expect(createdBook.title.length).toBe(MAX_TITLE_LENGTH);
    });

    test("should accept minimal valid string values", async () => {
      const book = createBook({ title: "A", description: "B", excerpt: "C" });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());
    });

    test("should create book and verify it can be retrieved", async () => {
      const book = createBook();

      const createResponse = await api.post(PATH_BOOKS, book);
      expect([STATUS_OK, STATUS_CREATED]).toContain(createResponse.status());

      const getResponse = await api.get(`${PATH_BOOKS}/${book.id}`);
      expect(getResponse.status()).toBe(STATUS_OK);

      const retrievedBook = await getResponse.json();
      expect(retrievedBook.id).toBe(book.id);
      expect(retrievedBook.title).toBe(book.title);
      expect(retrievedBook.description).toBe(book.description);
      expect(retrievedBook.pageCount).toBe(book.pageCount);
    });

    test("should return 400 for id bigger then int32", async () => {
      const invalidBook = { id: 2147483648 };
      const response = await api.post(PATH_BOOKS, invalidBook);
      const bodyText = await response.text();
      expect([STATUS_BAD_REQUEST]).toContain(response.status());
      expect(bodyText).toContain(
        "The JSON value could not be converted to System.Int32",
      );
    });

    test("should return 400 or 422 for wrong field type", async () => {
      const invalidBook = { title: INVALID_TITLE_NUMBER };
      const response = await api.post(PATH_BOOKS, invalidBook);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for missing required field", async () => {
      const invalidBook = { title: undefined };
      const response = await api.post(PATH_BOOKS, invalidBook);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for title exceeding 255 characters", async () => {
      const book = createBook({
        title: TEST_CHAR_X.repeat(OVERFLOW_TITLE_LENGTH),
      });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for non-string title", async () => {
      const book = createBook({ title: INVALID_TITLE_NUMBER as any });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for negative page count", async () => {
      const book = createBook({ pageCount: NEGATIVE_PAGE_COUNT });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for non-numeric page count", async () => {
      const book = createBook({ pageCount: INVALID_PAGE_COUNT_STRING as any });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for excessive page count overflow", async () => {
      const book = createBook({ pageCount: MAX_SAFE_PAGE_COUNT });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for invalid publish date format", async () => {
      const book = createBook({ publishDate: INVALID_DATE });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for future publish date", async () => {
      const futureDate = new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 365,
      ).toISOString();
      const book = createBook({ publishDate: futureDate });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 409 when creating book with duplicate ID", async () => {
      const book = createBook();

      const firstResponse = await api.post(PATH_BOOKS, book);
      expect([STATUS_OK, STATUS_CREATED]).toContain(firstResponse.status());

      const secondResponse = await api.post(PATH_BOOKS, book);
      expect([
        STATUS_BAD_REQUEST,
        STATUS_CONFLICT,
        STATUS_UNPROCESSABLE,
      ]).toContain(secondResponse.status());
    });

    test("should return 200 or 201 for null description", async () => {
      const book = createBook({ description: null as any });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());
    });

    // api defines title can be null, but logically that would make no sense, so if business logic is right and api not well-defined here we should expect 400
    test("should return 200 or 201 for null title", async () => {
      const book = createBook({ title: null as any });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());
    });

    test("should return 200 or 201 for null excerpt", async () => {
      const book = createBook({ excerpt: null as any });
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());
    });

    test("should return 400 or 422 for unexpected extra field", async () => {
      const book = createBook({ [EXTRA_FIELD_KEY]: EXTRA_FIELD_VALUE } as any);
      const response = await api.post(PATH_BOOKS, book);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for empty request body", async () => {
      const response = await api.post(PATH_BOOKS, {});

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });
  });
});
