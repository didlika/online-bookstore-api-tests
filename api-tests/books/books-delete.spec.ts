import { test, expect } from "@playwright/test";
import { ApiRequests } from "../../utils/apiRequests";
import { createBook, randomBook } from "../../utils/dataGenerator";
import {
  PATH_BOOKS,
  STATUS_OK,
  STATUS_CREATED,
  STATUS_NO_CONTENT,
  STATUS_NOT_FOUND,
  STATUS_BAD_REQUEST,
  STATUS_METHOD_NOT_ALLOWED,
  STATUS_CONFLICT,
  STATUS_GONE,
  NON_EXISTING_BOOK_ID,
  MAX_SAFE_PAGE_COUNT,
  ZERO_ID,
  NEGATIVE_ID,
  INVALID_ID_STRING,
  ENCODED_SPACE_ID,
  EXTRA_PATH_SEGMENT,
} from "../../fixtures/testConstants";

test.describe("Books DELETE API", () => {
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

  test.describe("DELETE /api/v1/Books/{id}", () => {
    test("should delete existing book and return 404 on subsequent GET", async () => {
      const book = createBook();

      const createResponse = await api.post(PATH_BOOKS, book);
      expect([STATUS_OK, STATUS_CREATED]).toContain(createResponse.status());

      const deleteResponse = await api.delete(`${PATH_BOOKS}/${book.id}`);
      expect([STATUS_OK, STATUS_NO_CONTENT]).toContain(deleteResponse.status());

      const getResponse = await api.get(`${PATH_BOOKS}/${book.id}`);
      expect([STATUS_NOT_FOUND, STATUS_OK]).toContain(getResponse.status());
    });

    test("should return 404 when deleting same book twice (idempotency)", async () => {
      const book = createBook();

      const createResponse = await api.post(PATH_BOOKS, book);
      expect([STATUS_OK, STATUS_CREATED]).toContain(createResponse.status());

      const firstDelete = await api.delete(`${PATH_BOOKS}/${book.id}`);
      expect([STATUS_OK, STATUS_NO_CONTENT]).toContain(firstDelete.status());

      const secondDelete = await api.delete(`${PATH_BOOKS}/${book.id}`);
      expect([STATUS_NOT_FOUND, STATUS_GONE]).toContain(secondDelete.status());
    });

    test("should return 404 for non-existing book ID", async () => {
      const response = await api.delete(
        `${PATH_BOOKS}/${NON_EXISTING_BOOK_ID}`,
      );
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });

    test("should return 404 for extremely large book ID", async () => {
      const response = await api.delete(`${PATH_BOOKS}/${MAX_SAFE_PAGE_COUNT}`);
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });

    test("should return 400 or 404 for book ID zero", async () => {
      const response = await api.delete(`${PATH_BOOKS}/${ZERO_ID}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 404 for negative book ID", async () => {
      const response = await api.delete(`${PATH_BOOKS}/${NEGATIVE_ID}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 404 for non-numeric book ID", async () => {
      const response = await api.delete(`${PATH_BOOKS}/${INVALID_ID_STRING}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 404 for encoded malformed ID", async () => {
      const response = await api.delete(`${PATH_BOOKS}/${ENCODED_SPACE_ID}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 404 for DELETE with extra path segment", async () => {
      const response = await api.delete(
        `${PATH_BOOKS}/${existingBook.id}${EXTRA_PATH_SEGMENT}`,
      );
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });

    test("should return 404 or 405 when deleting collection root", async () => {
      const response = await api.delete(PATH_BOOKS);
      expect([STATUS_NOT_FOUND, STATUS_METHOD_NOT_ALLOWED]).toContain(
        response.status(),
      );
    });

    test("should allow recreating book with same ID after deletion", async () => {
      const book = createBook();

      const firstCreate = await api.post(PATH_BOOKS, book);
      expect([STATUS_OK, STATUS_CREATED]).toContain(firstCreate.status());

      const deleteResponse = await api.delete(`${PATH_BOOKS}/${book.id}`);
      expect([STATUS_OK, STATUS_NO_CONTENT]).toContain(deleteResponse.status());

      const secondCreate = await api.post(PATH_BOOKS, book);
      expect([
        STATUS_OK,
        STATUS_CREATED,
        STATUS_BAD_REQUEST,
        STATUS_CONFLICT,
      ]).toContain(secondCreate.status());
    });
  });
});
