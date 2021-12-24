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
describe("Integration Test - Get Balance", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const password = await hash("12345", 8);
    await connection.query("delete from statements where 1 = 1");
    await connection.query(
      `INSERT INTO users (id, name, email, password, created_at)
      values('${user.id}', '${user.name}', '${user.email}', '${password}', 'now()')
      `
    );

    await connection.query(`
    INSERT INTO statements (id, user_id, description,amount, type)
    VALUES
    ('${uuidv4()}','${user.id}', 'deposit 100', '110', 'deposit'),
    ('${uuidv4()}','${user.id}', 'withdraw 100', '80', 'withdraw')
    `);

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

  it("Should be able to show a user balance", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(200);

    const balanceInfo = response.body;

    expect(balanceInfo).toHaveProperty("statement");
    expect(balanceInfo.balance).toEqual(30);
  });
});
