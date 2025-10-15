import { expect, test } from "@playwright/test";
import { ApiRequests } from "../utils/apiRequests";
import { createBook } from "../utils/dataGenerator";

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
      const response = await api.post("/Books", book);

      expect([200, 201]).toContain(response.status());

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

      const response1 = await api.post("/Books", book1);
      const response2 = await api.post("/Books", book2);

      expect([200, 201]).toContain(response1.status());
      expect([200, 201]).toContain(response2.status());

      const createdBook1 = await response1.json();
      const createdBook2 = await response2.json();

      expect(createdBook1.id).not.toBe(createdBook2.id);
    });

    test("should accept book with large page count", async () => {
      const book = createBook({ pageCount: 999999 });
      const response = await api.post("/Books", book);

      expect([200, 201]).toContain(response.status());
    });

    test("should accept title at maximum length of 255 characters", async () => {
      const longTitle = "T".repeat(255);
      const book = createBook({ title: longTitle });

      const response = await api.post("/Books", book);

      expect([200, 201]).toContain(response.status());

      const createdBook = await response.json();
      expect(createdBook.title.length).toBe(255);
    });

    test("should accept minimal valid string values", async () => {
      const book = createBook({ title: "A", description: "B", excerpt: "C" });
      const response = await api.post("/Books", book);

      expect([200, 201]).toContain(response.status());
    });

    test("should create book and verify it can be retrieved", async () => {
      const book = createBook();

      const createResponse = await api.post("/Books", book);
      expect([200, 201]).toContain(createResponse.status());

      const getResponse = await api.get(`/Books/${book.id}`);
      expect(getResponse.status()).toBe(200);

      const retrievedBook = await getResponse.json();
      expect(retrievedBook.id).toBe(book.id);
      expect(retrievedBook.title).toBe(book.title);
      expect(retrievedBook.description).toBe(book.description);
      expect(retrievedBook.pageCount).toBe(book.pageCount);
    });

    test("should return 400 for id bigger then int32", async () => {
      const invalidBook = { id: 2147483648 };
      const response = await api.post("/Books", invalidBook);
      const bodyText = await response.text();
      expect([400]).toContain(response.status());
      expect(bodyText).toContain(
        "The JSON value could not be converted to System.Int32",
      );
    });

    test("should return 400 or 422 for wrong field type", async () => {
      const invalidBook = { title: 123 };
      const response = await api.post("/Books", invalidBook);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for missing required field", async () => {
      const invalidBook = { title: undefined };
      const response = await api.post("/Books", invalidBook);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for title exceeding 255 characters", async () => {
      const book = createBook({ title: "X".repeat(256) });
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for non-string title", async () => {
      const book = createBook({ title: 12345 as any });
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for negative page count", async () => {
      const book = createBook({ pageCount: -10 });
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for non-numeric page count", async () => {
      const book = createBook({ pageCount: "NaN" as any });
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for excessive page count overflow", async () => {
      const book = createBook({ pageCount: Number.MAX_SAFE_INTEGER });
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for invalid publish date format", async () => {
      const book = createBook({ publishDate: "not-a-date" });
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for future publish date", async () => {
      const futureDate = new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 365,
      ).toISOString();
      const book = createBook({ publishDate: futureDate });
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 409 when creating book with duplicate ID", async () => {
      const book = createBook();

      const firstResponse = await api.post("/Books", book);
      expect([200, 201]).toContain(firstResponse.status());

      const secondResponse = await api.post("/Books", book);
      expect([400, 409, 422]).toContain(secondResponse.status());
    });

    test("should return 200 or 201 for null description", async () => {
      const book = createBook({ description: null as any });
      const response = await api.post("/Books", book);

      expect([200, 201]).toContain(response.status());
    });

    // api defines title can be null, but logically that would make no sense, so if business logic is right and api not well-defined here we should expect 400
    test("should return 200 or 201 for null title", async () => {
      const book = createBook({ title: null as any });
      const response = await api.post("/Books", book);

      expect([200, 201]).toContain(response.status());
    });

    test("should return 200 or 201 for null excerpt", async () => {
      const book = createBook({ excerpt: null as any });
      const response = await api.post("/Books", book);

      expect([200, 201]).toContain(response.status());
    });

    test("should return 400 or 422 for unexpected extra field", async () => {
      const book = createBook({ extraField: "extra" } as any);
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for empty request body", async () => {
      const response = await api.post("/Books", {});

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for ID as string", async () => {
      const book = createBook({ id: "1" as any });
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for ID of zero", async () => {
      const book = createBook({ id: 0 });
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for negative ID", async () => {
      const book = createBook({ id: -5 });
      const response = await api.post("/Books", book);

      expect([400, 422]).toContain(response.status());
    });
  });
});
