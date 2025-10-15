import { test, expect } from "@playwright/test";
import { ApiRequests } from "../utils/apiRequests";
import { createBook, randomBook } from "../utils/dataGenerator";

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
        title: existingBook.title + " Updated",
      };

      const response = await api.put(`/Books/${existingBook.id}`, updatedBook);

      expect(response.status()).toBe(200);

      const returnedBook = await response.json();
      expect(returnedBook.id).toBe(existingBook.id);
      expect(returnedBook.title).toBe(updatedBook.title);
    });

    test("should update multiple fields simultaneously", async () => {
      const updatedBook = {
        ...existingBook,
        title: "Multi Field Update",
        description: "Updated description",
        pageCount: (existingBook.pageCount || 100) + 1,
        excerpt: "Updated excerpt",
      };

      const response = await api.put(`/Books/${existingBook.id}`, updatedBook);

      expect(response.status()).toBe(200);

      const returnedBook = await response.json();
      expect(returnedBook.title).toBe(updatedBook.title);
      expect(returnedBook.description).toBe(updatedBook.description);
      expect(returnedBook.pageCount).toBe(updatedBook.pageCount);
      expect(returnedBook.excerpt).toBe(updatedBook.excerpt);
    });

    test("should accept update with unchanged publish date", async () => {
      const updatedBook = { ...existingBook };
      const response = await api.put(`/Books/${existingBook.id}`, updatedBook);

      expect(response.status()).toBe(200);
    });

    test("should accept update with new valid publish date", async () => {
      const updatedBook = {
        ...existingBook,
        publishDate: new Date().toISOString(),
      };

      const response = await api.put(`/Books/${existingBook.id}`, updatedBook);

      expect(response.status()).toBe(200);
    });

    test("should return consistent data for repeated identical PUT requests", async () => {
      const updatedBook = { ...existingBook, title: "Idempotent Title" };

      const response1 = await api.put(`/Books/${existingBook.id}`, updatedBook);
      const response2 = await api.put(`/Books/${existingBook.id}`, updatedBook);

      expect(response1.status()).toBe(200);
      expect(response2.status()).toBe(200);

      const returnedBook1 = await response1.json();
      const returnedBook2 = await response2.json();

      expect(returnedBook1.title).toBe(returnedBook2.title);
      expect(returnedBook1).toEqual(returnedBook2);
    });

    test("should accept update with large page count", async () => {
      const updatedBook = { ...existingBook, pageCount: 999999 };
      const response = await api.put(`/Books/${existingBook.id}`, updatedBook);

      expect(response.status()).toBe(200);
    });

    test("should accept title at maximum length of 255 characters", async () => {
      const updatedBook = { ...existingBook, title: "T".repeat(255) };

      const response = await api.put(`/Books/${existingBook.id}`, updatedBook);

      expect(response.status()).toBe(200);

      const returnedBook = await response.json();
      expect(returnedBook.title.length).toBe(255);
    });

    test("should return 404 when updating non-existing book", async () => {
      const nonExistingBook = {
        ...existingBook,
        id: 999999,
        title: "Non-existent",
      };
      const response = await api.put("/Books/999999", nonExistingBook);

      expect(response.status()).toBe(404);
    });

    test("should create book via POST then update it via PUT", async () => {
      const newBook = createBook();

      const createResponse = await api.post("/Books", newBook);
      expect([200, 201]).toContain(createResponse.status());

      const updatedBook = { ...newBook, title: newBook.title + " Changed" };
      const updateResponse = await api.put(`/Books/${newBook.id}`, updatedBook);

      expect(updateResponse.status()).toBe(200);

      const returnedBook = await updateResponse.json();
      expect(returnedBook.title).toBe(updatedBook.title);
    });

    test("should return 400 or 422 for missing id", async () => {
      const invalidBook = { ...existingBook };
      delete invalidBook.id;

      const response = await api.put(`/Books/${existingBook.id}`, invalidBook);

      expect([400, 422]).toContain(response.status());
    });

    // this one is logical to check from business perspective, however api definition allows title to be null, so this test might not be needed
    test("should return 400 or 422 for empty title", async () => {
      const invalidBook = { ...existingBook, title: "" };
      const response = await api.put(`/Books/${existingBook.id}`, invalidBook);

      expect([400, 422]).toContain(response.status());
    });

    // best practice if storing in db with varchar255, not necessary by api specification
    test("should return 400 or 422 for title exceeding 255 characters", async () => {
      const invalidBook = { ...existingBook, title: "X".repeat(256) };
      const response = await api.put(`/Books/${existingBook.id}`, invalidBook);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for non-string title", async () => {
      const invalidBook: any = { ...existingBook, title: 12345 };
      const response = await api.put(`/Books/${existingBook.id}`, invalidBook);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for negative page count", async () => {
      const invalidBook = { ...existingBook, pageCount: -10 };
      const response = await api.put(`/Books/${existingBook.id}`, invalidBook);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for non-numeric page count", async () => {
      const invalidBook: any = { ...existingBook, pageCount: "NaN" };
      const response = await api.put(`/Books/${existingBook.id}`, invalidBook);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for invalid publish date format", async () => {
      const invalidBook = { ...existingBook, publishDate: "not-a-date" };
      const response = await api.put(`/Books/${existingBook.id}`, invalidBook);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 409 when ID in path differs from ID in body", async () => {
      const invalidBook = {
        ...existingBook,
        id: existingBook.id + 1,
        title: "ID Mismatch",
      };

      const response = await api.put(`/Books/${existingBook.id}`, invalidBook);

      expect([400, 409]).toContain(response.status());
    });

    test("should return 400 or 422 for null description", async () => {
      const invalidBook = { ...existingBook, description: null };
      const response = await api.put(`/Books/${existingBook.id}`, invalidBook);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for empty request body", async () => {
      const response = await api.put(`/Books/${existingBook.id}`, {});

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 404 for negative ID in path", async () => {
      const payload = { ...existingBook, id: -1 };
      const response = await api.put("/Books/-1", payload);

      expect([400, 404]).toContain(response.status());
    });

    test("should return 400 or 404 for non-numeric ID in path", async () => {
      const payload = { ...existingBook, id: "abc" };
      const response = await api.put("/Books/abc", payload as any);

      expect([400, 404]).toContain(response.status());
    });

    test("should handle excessive page count overflow", async () => {
      const invalidBook = {
        ...existingBook,
        pageCount: Number.MAX_SAFE_INTEGER,
      };
      const response = await api.put(`/Books/${existingBook.id}`, invalidBook);

      expect([200, 400, 422]).toContain(response.status());
    });

    test("should handle or reject unexpected extra field", async () => {
      const modifiedBook: any = { ...existingBook, extraField: "extra" };
      const response = await api.put(`/Books/${existingBook.id}`, modifiedBook);

      expect([200, 400, 422]).toContain(response.status());
    });
  });
});
