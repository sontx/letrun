import { TaskDef } from "@letrun/common";

function buildIfTask(task: TaskDef) {
  task.name = "check_condition";
  task.parameters = {
    ...(task.parameters ?? {}),
    left: "${input.value}",
    operator: ">",
    right: 10,
  };
  task.then = [
    {
      name: "log_then",
      handler: "log",
      parameters: {
        message: "Value is greater than 10",
      },
    },
  ];
  task.else = [
    {
      name: "log_else",
      handler: "log",
      parameters: {
        message: "Value is less than or equal to 10",
      },
    },
  ];
  return task;
}

function buildSwitchTask(task: TaskDef) {
  task.name = "choose_case";
  task.decisionCases = {
    case1: [
      {
        name: "log_case1",
        handler: "log",
        parameters: {
          message: "Case 1 is selected",
        },
      },
    ],
    case2: [
      {
        name: "log_case2",
        handler: "log",
        parameters: {
          message: "Case 2 is selected",
        },
      },
    ],
  };
  task.defaultCase = [
    {
      name: "log_default",
      handler: "log",
      parameters: {
        message: "Default case is selected",
      },
    },
  ];
  return task;
}

function buildWhileTask(task: TaskDef) {
  task.name = "loop_while";
  task.parameters = {
    ...(task.parameters ?? {}),
    expression: "${input.value} < 10",
  };
  task.loopOver = [
    {
      name: "log_item",
      handler: "log",
      parameters: {
        message: "Item ${loop_while.output.item}",
      },
    },
  ];
  return task;
}

function buildRunWorkflowTask(task: TaskDef) {
  task.name = "run_sub_workflow";
  task.parameters = {
    ...(task.parameters ?? {}),
    file: "path/to/sub-workflow.json",
  };
  return task;
}

function buildLogTask(task: TaskDef) {
  task.name = "log_message";
  task.parameters = {
    ...(task.parameters ?? {}),
    message: "Hello, world!",
    level: "info",
  };
  return task;
}

function buildLambdaTask(task: TaskDef) {
  task.name = "evaluate_expression";
  task.parameters = {
    ...(task.parameters ?? {}),
    expression: "input.value * 2;",
    input: {
      value: 5,
    },
  };
  return task;
}

function buildIterateTask(task: TaskDef) {
  task.name = "loop_items";
  task.parameters = {
    ...(task.parameters ?? {}),
    items: [1, 2, 3, 4, 5],
  };
  task.loopOver = [
    {
      name: "log_item",
      handler: "log",
      parameters: {
        message: "Item ${loop_items.output.item}",
      },
    },
  ];
  return task;
}

function buildHttpTask(task: TaskDef) {
  task.name = "send_http_request";
  task.parameters = {
    ...(task.parameters ?? {}),
    url: "https://api.example.com",
  };
  return task;
}

function buildForTask(task: TaskDef) {
  task.name = "loop_range";
  task.parameters = {
    ...(task.parameters ?? {}),
    from: 1,
    to: 5,
    step: 1,
  };
  task.loopOver = [
    {
      name: "log_iteration",
      handler: "log",
      parameters: {
        message: "Item ${loop_range.output.index}",
      },
    },
  ];
  return task;
}

function buildDelayTask(task: TaskDef) {
  task.name = "delay_2_seconds";
  task.parameters = {
    ...(task.parameters ?? {}),
    time: "2s",
  };
  return task;
}

function buildCatchTask(task: TaskDef) {
  task.name = "catch_error";
  task.tasks = [
    {
      name: "business_logic",
      handler: "log",
      parameters: {
        message: "Business logic maybe failed",
      },
    },
  ];
  task.catch = [
    {
      name: "log_error",
      handler: "log",
      parameters: {
        message: "An error occurred: ${catch_error.output.error.message}",
      },
    },
  ];
  task.finally = [
    {
      name: "log_finally",
      handler: "log",
      parameters: {
        message: "Finally block executed, do some cleanup!",
      },
    },
  ];
  return task;
}

export const systemTasks: Record<string, (task: TaskDef) => TaskDef> = {
  if: buildIfTask,
  switch: buildSwitchTask,
  while: buildWhileTask,
  runWorkflow: buildRunWorkflowTask,
  log: buildLogTask,
  lambda: buildLambdaTask,
  iterate: buildIterateTask,
  http: buildHttpTask,
  for: buildForTask,
  delay: buildDelayTask,
  catch: buildCatchTask,
};
