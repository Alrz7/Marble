import { laila, nick } from "./fakeData";
type User = {
  user_address: string;
  identity_key: string;
};

async function createAccount(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const userInfo = { name, email, password };

  const response = await fetch("http://localhost:6280/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "create",
    },
    body: JSON.stringify(userInfo),
  });

  const result = await response.json();

  if (!response.ok) {
    console.log("Error:", result);
    throw new Error("Failed to create account");
  }
  return {
    user_address: result.user_address,
    identity_key: result.identity_key,
  };
}

async function createSession(alpha: User, beta: User, message: string) {
  const body = {
    alpha: alpha.user_address,
    alpha_prv_key: alpha.identity_key,
    beta: beta.user_address,
    message: message,
  };

  const response = await fetch("http://localhost:6280/account/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "create",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    console.log("error:", result);
    return;
  }
}

async function SendMesssage(alpha: User, beta: User, message: string) {
  const body = {
    alpha: alpha.user_address,
    alpha_prv_key: alpha.identity_key,
    beta: beta.user_address,
    message: message,
  };

  const response = await fetch("http://localhost:6280/account/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "send",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    console.log("error:", result);
    return;
  }
  console.log(result);
}

async function ReadMessages(alpha: User, beta: User, count: number) {
  const body = {
    alpha: alpha.user_address,
    alpha_prv_key: alpha.identity_key,
    beta: beta.user_address,
    count: count,
  };

  const response = await fetch("http://localhost:6280/account/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "read",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    console.log("error:", result);
    return;
  }
  console.log(result);
}

async function main() {
  // CreateTestAccountAndSession()
  // testSendMesage();
  testReadMessage();
}
main();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function CreateTestAccountAndSession() {
  const alpha = await createAccount("nick", "nick@gmail.com", "nick123");
  await sleep(1000);
  const beta = await createAccount("laila", "laila@gmail.com", "laila456");
  await sleep(2000);
  await createSession(alpha, beta, "hi there this is a test!");
}

async function testReadMessage() {
  ReadMessages(nick, laila, -1);
  // ReadMessages(laila, nick, -1);
}

async function testSendMesage() {
  // SendMesssage(nick, laila, "hi there this is a test message");
  SendMesssage(laila, nick, "Hi There, looks like it's working! :)");
}

// async function CreateNewTask() {
//   const duration = {
//     week: 0,
//     day: 0,
//     hour: 0,
//     minute: 0,
//     second: 8,
//   };
//   const newTask = {
//     name: "coingfinder1",
//     provider: "gecko",
//     duration: duration,
//   };

//   const response = await fetch("http://localhost:4242/tasks", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       order: "create",
//       taskType: "providing",
//     },
//     body: JSON.stringify(newTask),
//   });
//   const result = await response.json();
//   if (response.ok) {
//     console.log(result);
//   } else {
//     console.log(result);
//   }
// }

// async function CreateNewCycles() {
//   const newCycle = {
//     name: "Tcycle3",
//     providing_tasks: ["Tcoingfinder1"],
//     analyzing_tasks: [],
//   };

//   const response = await fetch("http://localhost:4242/cycles", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       order: "create",
//     },
//     body: JSON.stringify(newCycle),
//   });
//   const result = await response.json();
//   if (response.ok) {
//     console.log(result);
//   } else {
//     console.log(result);
//   }
// }

// async function sendNewOrder(cycle: string, order: number) {
//   const NewOrder = {
//     cycle: cycle,
//     order: order,
//   };

//   const response = await fetch("http://localhost:4242/cycles", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       order: "order",
//     },
//     body: JSON.stringify(NewOrder),
//   });
//   const result = await response.json();
//   if (response.ok) {
//     console.log(result);
//   } else {
//     console.log(result);
//   }
// }

// async function getCycleStat(name: string) {
//   const input = {
//     name: name,
//   };
//   const response = await fetch("http://localhost:4242/cycles", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       order: "report",
//     },
//     body: JSON.stringify(input),
//   });
//   const result = await response.json();
//   if (response.ok) {
//     console.log(result);
//   } else {
//     console.log(result);
//   }
// }

// async function saveConfig() {
//   const response = await fetch("http://localhost:4242/config", {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//       order: "save",
//       configType: "app",
//     },
//   });
//   const result = await response.json();
//   if (response.ok) {
//     console.log(result.message);
//   } else {
//     console.log(result.error);
//   }
// }

// CreateNewTask();
// // CreateNewCycles()

// // sendNewOrder("Tcycle1", 1);
// // setTimeout(() => {
// //   sendNewOrder("Tcycle1", 2);
// // }, 5000);
// // setTimeout(() => {
// //   getCycleStat("Tcycle1");
// // }, 7000);

// // sendNewOrder("Tcycle1", 0);
// // getCycleStat("Tcycle1");

// // saveConfig();

// // try {
// //   // const response =
// //   await fetch("http://localhost:4242/text", {
// //     method: "POST",
// //     headers: {
// //       "Content-Type": "application/json",
// //     },
// //     body: JSON.stringify(data),
// //   });

// //  const result = await response.json();
// //  console.log("Response from Go:", result);
