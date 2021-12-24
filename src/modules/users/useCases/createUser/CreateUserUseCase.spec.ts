import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "../createUser/CreateUserError";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe("Unit Test - Create User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  });

  it("Should be able to create new user", async () => {
    const user = await createUserUseCase.execute({
      name: "Test User",
      email: "test@test.com",
      password: "12345",
    });

    expect(user).toHaveProperty("id");
  });

  it("Should not be to create a new user if exist email", () => {
    expect(async () => {
      await createUserUseCase.execute({
        name: "Test User",
        email: "test@test.com",
        password: "12345",
      });
      await createUserUseCase.execute({
        name: "Test User",
        email: "test@test.com",
        password: "12345",
      });
    }).rejects.toBeInstanceOf(CreateUserError);
  });
});
