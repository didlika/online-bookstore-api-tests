import { expect, test } from "@playwright/test";
import { ApiRequests } from "../utils/apiRequests";
import { getRandomBookId, randomBook } from "../utils/dataGenerator";

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
      const response = await api.get("/Books");

      expect(response.status()).toBe(200);

      const books = await response.json();
      expect(Array.isArray(books)).toBe(true);
      expect(books.length).toBe(200);
      expect(books.length).toBeGreaterThan(0);
    });

    test("should return 404 for invalid collection path", async () => {
      const response = await api.get("/Bookz");
      expect(response.status()).toBe(404);
    });
  });

  test.describe("GET /api/v1/Books/{id}", () => {
    test("should return book with correct schema for valid ID", async () => {
      const bookId = getRandomBookId();
      const response = await api.get(`/Books/${bookId}`);

      expect(response.status()).toBe(200);

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
        api.get(`/Books/${bookId}`),
        api.get(`/Books/${bookId}`),
      ]);

      expect(response1.status()).toBe(200);
      expect(response2.status()).toBe(200);

      const [book1, book2] = await Promise.all([
        response1.json(),
        response2.json(),
      ]);

      expect(book1).toEqual(book2);
    });

    test("should have valid publishDate format", async () => {
      const bookId = getRandomBookId();
      const response = await api.get(`/Books/${bookId}`);

      expect(response.status()).toBe(200);

      const book = await response.json();
      const publishDate = new Date(book.publishDate);
      expect(publishDate.toString()).not.toBe("Invalid Date");
    });

    test("should fetch random book successfully", async () => {
      const randomBookData = await randomBook(api);

      const response = await api.get(`/Books/${randomBookData.id}`);
      expect(response.status()).toBe(200);

      const book = await response.json();
      expect(book.id).toBe(randomBookData.id);
    });

    test("should return 404 for non-existing book", async () => {
      const response = await api.get("/Books/999999");
      expect(response.status()).toBe(404);
    });

    test("Should return 404 or 400 for id 0", async () => {
      const response = await api.get("/Books/0");
      expect([400, 404]).toContain(response.status());
    });

    test("Should return 404 or 400 for negative id", async () => {
      const response = await api.get("/Books/-1");
      expect([400, 404]).toContain(response.status()); // why 400???
    });

    test("Should return 404 or 400 for non-numeric id", async () => {
      const response = await api.get("/Books/abc");
      expect([400, 404]).toContain(response.status());
    });

    test("Should return 404 or 400 for encoded malformed id", async () => {
      const response = await api.get("/Books/%20");
      expect([400, 404]).toContain(response.status());
    });

    test("should return 404 for extra path segment", async () => {
      const bookId = getRandomBookId();
      const response = await api.get(`/Books/${bookId}/extra`);
      expect(response.status()).toBe(404);
    });
  });
});
