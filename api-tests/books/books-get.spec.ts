import { expect, test } from "@playwright/test";
import { ApiRequests } from "../../utils/apiRequests";
import { getRandomBookId, randomBook } from "../../utils/dataGenerator";
import {
  PATH_BOOKS,
  PATH_INVALID,
  STATUS_OK,
  STATUS_NOT_FOUND,
  STATUS_BAD_REQUEST,
  NON_EXISTING_BOOK_ID,
  ZERO_ID,
  NEGATIVE_ID,
  INVALID_ID_STRING,
  ENCODED_SPACE_ID,
  EXTRA_PATH_SEGMENT,
} from "../../fixtures/testConstants";

test.describe("Books GET API", () => {
  let api: ApiRequests;

  test.beforeAll(async ({ baseURL }) => {
    api = new ApiRequests(baseURL!);
    await api.init();
  });

  test.afterAll(async () => {
    await api.close();
  });

  test.describe("GET /api/v1/Books", () => {
    test("should return all books with 200 status", async () => {
      const response = await api.get(PATH_BOOKS);

      expect(response.status()).toBe(STATUS_OK);

      const books = await response.json();
      expect(Array.isArray(books)).toBe(true);
      expect(books.length).toBe(200);
      expect(books.length).toBeGreaterThan(0);
    });

    test("should return 404 for invalid collection path", async () => {
      const response = await api.get(PATH_INVALID);
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });
  });

  test.describe("GET /api/v1/Books/{id}", () => {
    test("should return book with correct schema for valid ID", async () => {
      const bookId = getRandomBookId();
      const response = await api.get(`${PATH_BOOKS}/${bookId}`);

      expect(response.status()).toBe(STATUS_OK);

      const book = await response.json();
      expect(book).toMatchObject({
        id: bookId,
        title: expect.any(String),
        description: expect.any(String),
        pageCount: expect.any(Number),
        excerpt: expect.any(String),
        publishDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      });
    });

    test("should return consistent data for repeated requests", async () => {
      const bookId = getRandomBookId();

      const [response1, response2] = await Promise.all([
        api.get(`${PATH_BOOKS}/${bookId}`),
        api.get(`${PATH_BOOKS}/${bookId}`),
      ]);

      expect(response1.status()).toBe(STATUS_OK);
      expect(response2.status()).toBe(STATUS_OK);

      const [book1, book2] = await Promise.all([
        response1.json(),
        response2.json(),
      ]);

      expect(book1).toEqual(book2);
    });

    test("should have valid publishDate format", async () => {
      const bookId = getRandomBookId();
      const response = await api.get(`${PATH_BOOKS}/${bookId}`);

      expect(response.status()).toBe(STATUS_OK);

      const book = await response.json();
      const publishDate = new Date(book.publishDate);
      expect(publishDate.toString()).not.toBe("Invalid Date");
    });

    test("should fetch random book successfully", async () => {
      const randomBookData = await randomBook(api);

      const response = await api.get(`${PATH_BOOKS}/${randomBookData.id}`);
      expect(response.status()).toBe(STATUS_OK);

      const book = await response.json();
      expect(book.id).toBe(randomBookData.id);
    });

    test("should return 404 for non-existing book", async () => {
      const response = await api.get(`${PATH_BOOKS}/${NON_EXISTING_BOOK_ID}`);
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });

    test("Should return 404 or 400 for id 0", async () => {
      const response = await api.get(`${PATH_BOOKS}/${ZERO_ID}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 404 or 400 for negative ID", async () => {
      const response = await api.get(`${PATH_BOOKS}/${NEGATIVE_ID}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 404 or 400 for non-numeric ID", async () => {
      const response = await api.get(`${PATH_BOOKS}/${INVALID_ID_STRING}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 404 or 400 for encoded space as ID", async () => {
      const response = await api.get(`${PATH_BOOKS}/${ENCODED_SPACE_ID}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 404 for extra path segment", async () => {
      const bookId = getRandomBookId();
      const response = await api.get(
        `${PATH_BOOKS}/${bookId}${EXTRA_PATH_SEGMENT}`,
      );
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });
  });
});
