import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createUserUseCase: CreateUserUseCase;
describe("Unit Test - Authenticate User", () => {
  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository
    );
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  });

  it("Should be return a user and token", async () => {
    const user = await createUserUseCase.execute({
      name: "Test User",
      email: "test@test.com",
      password: "12345",
    });
    const authorization = await authenticateUserUseCase.execute({
      email: user.email,
      password: "12345",
    });

    expect(authorization).toHaveProperty("user.id");
    expect(authorization).toHaveProperty("token");
  });
});
