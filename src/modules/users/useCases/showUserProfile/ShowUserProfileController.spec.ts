import { app } from "../../../../app";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import authConfig from "../../../../config/auth";

let connection: Connection;
let token: string;
const user = {
  id: uuidv4(),
  name: "juvenal sauro",
  email: "juvenal@test.com.br",
};
describe("Integration Test - Show User Profile", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const password = await hash("12345", 8);

    await connection.query(
      `INSERT INTO users (id, name, email, password, created_at)
      values('${user.id}', '${user.name}', '${user.email}', '${password}', 'now()')
      `
    );
    const { expiresIn, secret } = authConfig.jwt;
    token = sign({ user }, secret, {
      subject: user.id,
      expiresIn,
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to return a user auth", async () => {
    const response = await request(app)
      .get("/api/v1/profile")
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(200);

    const userAuth = response.body;
    expect(userAuth.id).toEqual(user.id);
    expect(userAuth.email).toEqual(user.email);
    expect(userAuth.name).toEqual(user.name);
  });
});
