import { ApiRequests } from "./apiRequests";

const BOOK_ID_RANGE = { min: 1, max: 200 };
const NEW_BOOK_ID_RANGE = { min: 201, max: 1200 };

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomBookId(): number {
  return getRandomInt(BOOK_ID_RANGE.min, BOOK_ID_RANGE.max);
}

export function getRandomNewBookId(): number {
  return getRandomInt(NEW_BOOK_ID_RANGE.min, NEW_BOOK_ID_RANGE.max);
}

export async function randomBook(api: ApiRequests) {
  const randomId = getRandomBookId();
  const response = await api.get(`/Books/${randomId}`);

  if (response.status() !== 200) {
    throw new Error(
      `Failed to fetch book with id ${randomId}. Status: ${response.status()}`,
    );
  }

  return await response.json();
}

export function createBook(
  overrides: Partial<{
    id: number;
    title: string;
    description: string;
    pageCount: number;
    excerpt: string;
    publishDate: string;
  }> = {},
) {
  const id = overrides.id ?? getRandomNewBookId();

  return {
    id,
    title: `Book ${id}`,
    description: "Test description for automated testing.",
    pageCount: getRandomInt(100, 1000),
    excerpt: "Test excerpt for automated testing.",
    publishDate: new Date().toISOString(),
    ...overrides,
  };
}
