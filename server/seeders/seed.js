import { faker } from "@faker-js/faker";
import { User } from "../models/user.model.js";
const createUser = async (newUsers) => {
  try {
    const userPromise = [];
    console.log("dssdsd");
    for (let i = 0; i < newUsers; i++) {
      const tempUser = await User.create({
        name: faker.person.fullName(),
        username: faker.internet.userName(),
        bio: faker.lorem.sentence(10),
        password: "password",
        avatar: {
          url: faker.image.avatar(),
          public_id: faker.system.fileName(),
        },
      });
      userPromise.push(tempUser);
    }
    await Promise.all(userPromise);
    console.log("User Created", newUsers);
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export { createUser };
