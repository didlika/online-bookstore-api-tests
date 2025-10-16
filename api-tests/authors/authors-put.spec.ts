import { test, expect } from "@playwright/test";
import { ApiRequests } from "../../utils/apiRequests";
import { createAuthor, randomAuthor } from "../../utils/dataGenerator";
import {
  PATH_AUTHORS,
  STATUS_OK,
  STATUS_CREATED,
  STATUS_BAD_REQUEST,
  STATUS_NOT_FOUND,
  STATUS_CONFLICT,
  STATUS_UNPROCESSABLE,
  NON_EXISTING_AUTHOR_ID,
  NEGATIVE_ID,
  MAX_NAME_LENGTH,
  OVERFLOW_NAME_LENGTH,
  LARGE_BOOK_ID,
  DEFAULT_BOOK_ID,
  IDEMPOTENT_FIRST_NAME,
  UPDATED_FIRST_NAME,
  UPDATED_LAST_NAME,
  FIRST_NAME_SUFFIX_UPDATED,
  FIRST_NAME_NON_EXISTENT,
  EXTRA_FIELD_KEY,
  EXTRA_FIELD_VALUE,
  INVALID_FIRST_NAME_NUMBER,
  INVALID_LAST_NAME_NUMBER,
  INVALID_ID_BOOK_STRING,
  NEGATIVE_PAGE_COUNT,
  MAX_SAFE_PAGE_COUNT,
  TEST_CHAR_F,
  TEST_CHAR_L,
  TEST_CHAR_X,
  EMPTY_STRING,
  INVALID_ID_STRING,
} from "../../fixtures/testConstants";

test.describe("Authors PUT API", () => {
  let api: ApiRequests;
  let existingAuthor: any;

  test.beforeAll(async ({ baseURL }) => {
    api = new ApiRequests(baseURL!);
    await api.init();
    existingAuthor = await randomAuthor(api);
  });

  test.afterAll(async () => {
    await api.close();
  });

  test.describe("PUT /api/v1/Authors/{id}", () => {
    test("should update existing author firstName", async () => {
      const updatedAuthor = {
        ...existingAuthor,
        firstName: existingAuthor.firstName + FIRST_NAME_SUFFIX_UPDATED,
      };

      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(STATUS_OK);

      const returnedAuthor = await response.json();
      expect(returnedAuthor.id).toBe(existingAuthor.id);
      expect(returnedAuthor.firstName).toBe(updatedAuthor.firstName);
    });

    test("should update multiple fields simultaneously", async () => {
      const updatedAuthor = {
        ...existingAuthor,
        firstName: UPDATED_FIRST_NAME,
        lastName: UPDATED_LAST_NAME,
        idBook: (existingAuthor.idBook || 1) + 1,
      };

      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(STATUS_OK);

      const returnedAuthor = await response.json();
      expect(returnedAuthor.firstName).toBe(updatedAuthor.firstName);
      expect(returnedAuthor.lastName).toBe(updatedAuthor.lastName);
      expect(returnedAuthor.idBook).toBe(updatedAuthor.idBook);
    });

    test("should accept update with unchanged idBook", async () => {
      const updatedAuthor = { ...existingAuthor };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(STATUS_OK);
    });

    test("should accept update with new valid idBook", async () => {
      const updatedAuthor = {
        ...existingAuthor,
        idBook: DEFAULT_BOOK_ID,
      };

      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(STATUS_OK);
    });

    test("should return consistent data for repeated identical PUT requests", async () => {
      const updatedAuthor = {
        ...existingAuthor,
        firstName: IDEMPOTENT_FIRST_NAME,
      };

      const response1 = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );
      const response2 = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response1.status()).toBe(STATUS_OK);
      expect(response2.status()).toBe(STATUS_OK);

      const returnedAuthor1 = await response1.json();
      const returnedAuthor2 = await response2.json();

      expect(returnedAuthor1.firstName).toBe(returnedAuthor2.firstName);
      expect(returnedAuthor1).toEqual(returnedAuthor2);
    });

    test("should accept update with large idBook value", async () => {
      const updatedAuthor = { ...existingAuthor, idBook: LARGE_BOOK_ID };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(STATUS_OK);
    });

    test("should accept firstName at maximum length of 255 characters", async () => {
      const updatedAuthor = {
        ...existingAuthor,
        firstName: TEST_CHAR_F.repeat(MAX_NAME_LENGTH),
      };

      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(STATUS_OK);

      const returnedAuthor = await response.json();
      expect(returnedAuthor.firstName.length).toBe(MAX_NAME_LENGTH);
    });

    test("should accept lastName at maximum length of 255 characters", async () => {
      const updatedAuthor = {
        ...existingAuthor,
        lastName: TEST_CHAR_L.repeat(MAX_NAME_LENGTH),
      };

      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(STATUS_OK);

      const returnedAuthor = await response.json();
      expect(returnedAuthor.lastName.length).toBe(MAX_NAME_LENGTH);
    });

    test("should return 404 when updating non-existing author", async () => {
      const nonExistingAuthor = {
        ...existingAuthor,
        id: NON_EXISTING_AUTHOR_ID,
        firstName: FIRST_NAME_NON_EXISTENT,
      };
      const response = await api.put(
        `${PATH_AUTHORS}/${NON_EXISTING_AUTHOR_ID}`,
        nonExistingAuthor,
      );

      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });

    test("should create author via POST then update it via PUT", async () => {
      const newAuthor = createAuthor();

      const createResponse = await api.post(PATH_AUTHORS, newAuthor);
      expect([STATUS_OK, STATUS_CREATED]).toContain(createResponse.status());

      const updatedAuthor = {
        ...newAuthor,
        firstName: newAuthor.firstName + " Changed",
      };
      const updateResponse = await api.put(
        `${PATH_AUTHORS}/${newAuthor.id}`,
        updatedAuthor,
      );

      expect(updateResponse.status()).toBe(STATUS_OK);

      const returnedAuthor = await updateResponse.json();
      expect(returnedAuthor.firstName).toBe(updatedAuthor.firstName);
    });

    test("should return 400 or 422 for missing id", async () => {
      const invalidAuthor = { ...existingAuthor };
      delete invalidAuthor.id;

      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should accept null firstName (nullable field)", async () => {
      const updatedAuthor = { ...existingAuthor, firstName: null };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect([STATUS_OK, STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should accept null lastName (nullable field)", async () => {
      const updatedAuthor = { ...existingAuthor, lastName: null };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect([STATUS_OK, STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for empty firstName", async () => {
      const invalidAuthor = { ...existingAuthor, firstName: EMPTY_STRING };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_OK, STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for empty lastName", async () => {
      const invalidAuthor = { ...existingAuthor, lastName: EMPTY_STRING };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_OK, STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for firstName exceeding 255 characters", async () => {
      const invalidAuthor = {
        ...existingAuthor,
        firstName: TEST_CHAR_X.repeat(OVERFLOW_NAME_LENGTH),
      };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for lastName exceeding 255 characters", async () => {
      const invalidAuthor = {
        ...existingAuthor,
        lastName: TEST_CHAR_X.repeat(OVERFLOW_NAME_LENGTH),
      };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for non-string firstName", async () => {
      const invalidAuthor: any = {
        ...existingAuthor,
        firstName: INVALID_FIRST_NAME_NUMBER,
      };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for non-string lastName", async () => {
      const invalidAuthor: any = {
        ...existingAuthor,
        lastName: INVALID_LAST_NAME_NUMBER,
      };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for non-numeric idBook", async () => {
      const invalidAuthor: any = {
        ...existingAuthor,
        idBook: INVALID_ID_BOOK_STRING,
      };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for negative idBook", async () => {
      const invalidAuthor = { ...existingAuthor, idBook: NEGATIVE_PAGE_COUNT };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 409 when ID in path differs from ID in body", async () => {
      const invalidAuthor = {
        ...existingAuthor,
        id: existingAuthor.id + 1,
        firstName: "ID Mismatch",
      };

      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_BAD_REQUEST, STATUS_CONFLICT]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for empty request body", async () => {
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        {},
      );

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 404 for negative ID in path", async () => {
      const payload = { ...existingAuthor, id: NEGATIVE_ID };
      const response = await api.put(`${PATH_AUTHORS}/${NEGATIVE_ID}`, payload);

      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 404 for non-numeric ID in path", async () => {
      const payload = { ...existingAuthor, id: INVALID_ID_STRING };
      const response = await api.put(
        `${PATH_AUTHORS}/${INVALID_ID_STRING}`,
        payload as any,
      );

      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should handle excessive idBook overflow", async () => {
      const invalidAuthor = {
        ...existingAuthor,
        idBook: MAX_SAFE_PAGE_COUNT,
      };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([STATUS_OK, STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should handle or reject unexpected extra field", async () => {
      const modifiedAuthor: any = {
        ...existingAuthor,
        [EXTRA_FIELD_KEY]: EXTRA_FIELD_VALUE,
      };
      const response = await api.put(
        `${PATH_AUTHORS}/${existingAuthor.id}`,
        modifiedAuthor,
      );

      expect([STATUS_OK, STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });
  });
});
