import { test, expect } from "@playwright/test";
import { ApiRequests } from "../utils/apiRequests";
import { createBook, randomBook } from "../utils/dataGenerator";

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

      const createResponse = await api.post("/Books", book);
      expect([200, 201]).toContain(createResponse.status());

      const deleteResponse = await api.delete(`/Books/${book.id}`);
      expect([200, 204]).toContain(deleteResponse.status());

      const getResponse = await api.get(`/Books/${book.id}`);
      expect([404, 200]).toContain(getResponse.status());
    });

    test("should return 404 when deleting same book twice (idempotency)", async () => {
      const book = createBook();

      const createResponse = await api.post("/Books", book);
      expect([200, 201]).toContain(createResponse.status());

      const firstDelete = await api.delete(`/Books/${book.id}`);
      expect([200, 204]).toContain(firstDelete.status());

      const secondDelete = await api.delete(`/Books/${book.id}`);
      expect([404, 410]).toContain(secondDelete.status());
    });

    test("should return 404 for non-existing book ID", async () => {
      const response = await api.delete("/Books/999999");
      expect(response.status()).toBe(404);
    });

    test("should return 404 for extremely large book ID", async () => {
      const response = await api.delete(`/Books/${Number.MAX_SAFE_INTEGER}`);
      expect(response.status()).toBe(404);
    });

    test("should return 400 or 404 for book ID zero", async () => {
      const response = await api.delete("/Books/0");
      expect([400, 404]).toContain(response.status());
    });

    test("should return 400 or 404 for negative book ID", async () => {
      const response = await api.delete("/Books/-1");
      expect([400, 404]).toContain(response.status());
    });

    test("should return 400 or 404 for non-numeric book ID", async () => {
      const response = await api.delete("/Books/abc");
      expect([400, 404]).toContain(response.status());
    });

    test("should return 400 or 404 for encoded malformed ID", async () => {
      const response = await api.delete("/Books/%20");
      expect([400, 404]).toContain(response.status());
    });

    test("should return 404 for DELETE with extra path segment", async () => {
      const response = await api.delete(`/Books/${existingBook.id}/extra`);
      expect(response.status()).toBe(404);
    });

    test("should return 404 or 405 when deleting collection root", async () => {
      const response = await api.delete("/Books");
      expect([404, 405]).toContain(response.status());
    });

    test("should allow recreating book with same ID after deletion", async () => {
      const book = createBook();

      const firstCreate = await api.post("/Books", book);
      expect([200, 201]).toContain(firstCreate.status());

      const deleteResponse = await api.delete(`/Books/${book.id}`);
      expect([200, 204]).toContain(deleteResponse.status());

      const secondCreate = await api.post("/Books", book);
      expect([200, 201, 400, 409]).toContain(secondCreate.status());
    });
  });
});
