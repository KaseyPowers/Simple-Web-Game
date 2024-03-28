// import dependencies
import React from "react";

import { render, screen } from "@testing-library/react";
import Page from "./page";

// mocking setup
jest.mock("next/navigation");
jest.mock("~/game_logic/socket_io/client");

describe("Landing Page", () => {
  test("renders succesfully", () => {
    render(<Page />);
  });

  test("has create button", () => {
    render(<Page />);
    expect(screen.getByText("Create Room")).toHaveRole("button");
  });
});
