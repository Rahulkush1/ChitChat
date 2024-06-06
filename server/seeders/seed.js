import { faker, simpleFaker } from "@faker-js/faker";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
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

const createSingleChats = async (numChats) => {
  try {
    const users = await User.find().select("_id");

    const chatsPromise = [];

    for (let i = 0; i < numChats; i++) {
      for (let j = i + 1; j < numChats; j++) {
        chatsPromise.push(
          Chat.create({
            name: faker.lorem.words(2),
            memebers: [users[i], users[j]],
          })
        );
      }
    }

    await Promise.all(chatsPromise);
    console.log("Chat Created", numChats);
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const createGroupChats = async (numChats) => {
  try {
    const users = await User.find().select("_id");

    const chatsPromise = [];

    for (let i = 0; i < numChats; i++) {
      const numMembers = simpleFaker.number.int({ min: 3, max: users.length });
      const members = [];
      for (let j = 0; j < numMembers; j++) {
        const randomIndex = Math.floor(Math.random() * users.length);
        const randomUser = users[randomIndex];

        if (!members.includes(randomUser)) {
          members.push(randomUser);
        }
      }
      const chat = Chat.create({
        groupChat: true,
        name: faker.lorem.words(2),
        members,
        creator: members[0],
      });
      chatsPromise.push(chat);
    }

    await Promise.all(chatsPromise);
    console.log("Chat Created", numChats);
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const createMessage = async (numOfMessages) => {
  try {
    const users = await User.find().select("_id");
    const chats = await Chat.find().select("_id");

    const messagesPromise = [];

    for (let i = 0; i < numOfMessages; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomChat = chats[Math.floor(Math.random() * users.length)];

      messagesPromise.push(
        Message.create({
          chat: randomChat,
          sender: randomUser,
          content: faker.lorem.sentence(),
        })
      );
    }

    await Promise.all(messagesPromise);
    console.log("Message Created Successfully", numOfMessages);
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const createMessageInChat = async (chatId, numOfMessages) => {
  try {
    const users = await User.find().select("_id");

    const messagesPromise = [];

    for (let i = 0; i < numOfMessages; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      messagesPromise.push(
        Message.create({
          chat: chatId,
          sender: randomUser,
          content: faker.lorem.sentence(),
        })
      );
    }

    await Promise.all(messagesPromise);
    console.log("Message Created Successfully", numOfMessages);
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export { createUser, createSingleChats, createGroupChats, createMessage,createMessageInChat };
