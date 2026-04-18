async function createAcount() {
  const userInfo = {
   name : "navid",
   email: "navid@gmail.com",
   password: "navid123"
  };
  const response = await fetch("http://localhost:6280/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "create",
    },
    body: JSON.stringify(userInfo),
  });
  const result = await response.json();
  console.log(response)
  if (response.ok) {
    console.log(result);
  } else {
    console.log(result);
  }
}

createAcount()



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
