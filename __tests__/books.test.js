 /** Tests for Books Route */

process.env.NODE_ENV = "test"

const request = require("supertest");
const app = require("../app");
const db = require("../db");

// isbn sample
let book_isbn;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO
        books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES(
            '123456789',
            'https://amazon.com/taco',
            'Elie',
            'English',
            100,
            'Publisher sample',
            'my book', 1991)
        RETURNING isbn`);
    
    book_isbn = result.rows[0].isbn
});

describe("POST /books", function() {
    test("Creates a new book", async function() {
        const response = await request(app)
            .post(`/books`)
            .send({
                isbn: '9876543',
                amazon_url: 'https://amazon.com/test',
                author: "tester",
                language: "english",
                pages: 1000,
                publisher: "anonymous",
                title: "say wut",
                year: 2030
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
    });

    test("Prevents creating book without requirement", async function () {
        const response = await request(app)
            .post(`/books`)
            .send({year: 2000});
        expect(response.statusCode).toBe(400);
    });
});

describe("GET /books", function() {
    test("Gets a list of 1 book", async function() {
        const response = await request(app).get(`/books`);
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0])/.toHaveProperty("amazon_url");
    });
});

describe("GET /books/:isbn", function() {
    test("Get a single book", async function() {
        const response = await request(app)
            .get(`/books/${book_isbn}`)
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.isbn).toBe(book_isbn);
    });

    test("404 response if book is not found", async function() {
        const response = await request(app)
            .get(`/books/9999`)
        expect(response.statusCode).toBe(404);
    })
})

describe("PUT /books/:id", function() {
    test("Update single book"), async function() {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                amazon_url: "https://test.com",
                author: "mcfly",
                language: "english",
                pages: 500,
                publisher: "nope nah",
                title: "Updated Libro",
                year: 2005
            });
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.title).toBe("Updated Libro");
    };


    test("Prevent an incorrect book update", async function() {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                isbn: "353535353",
                badField: "DO NOT ADD",
                amazon_url: "https://test.com",
                author: "mcfly",
                language: "english",
                pages: 500,
                publisher: "nope nah",
                title: "Updated Libro",
                year: 2005
            });
        expect(response.statusCode).toBe(400);
    });

    test("404 response if book cannot be found.", async function() {
        await request(app)
            .delete(`/books/${book_isbn}`)
        const response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.statusCode).toBe(404);
    });
});

decribe("DELETE /books/:id", function() {
    test("Delete single book", async function() {
        const response = await request(app)
            .delete(`/books/${book_isbn}`)
        expect(response.body).toEqual({message: "Book deleted"});
    });
});

afterEach(async function() {
    await db.query("Delete from books");
});

afterAll(async function() {
    await db.end()
});
