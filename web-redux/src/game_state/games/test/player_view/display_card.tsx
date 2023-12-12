import { useMemo } from "react";
import {
  PromptCard,
  AnswerCard,
  CardTypeKeys,
} from "../../../../game_definition";

import { Card, CardContent, Typography, Badge } from "@mui/material";

const DisplayCard = ({
  card,
  answerCards,
  answerType,
  onClick,
  selected,
}: {
  card: PromptCard | AnswerCard;
  answerCards?: Array<AnswerCard | false>;
  answerType?: "preview" | "confirmed";
  onClick?: React.MouseEventHandler<HTMLElement>;
  selected?: boolean | number;
}) => {
  const isPrompt = useMemo(
    () => card.type === CardTypeKeys.PROMPT,
    [card.type],
  );

  const displayText = useMemo(() => {
    // non-prompt cards don't have fancy logic.
    if (!isPrompt) {
      return card.value;
    }
    let parts: React.ReactNode[] = [];
    let previewIndex = 0;
    let answerColor: string | undefined = undefined;

    switch (answerType) {
      case "preview":
        answerColor = "warning.light";
        break;
      case "confirmed":
        answerColor = "info.light";
        break;
    }

    (card.value as Array<string | false>).forEach((value, index) => {
      if (value) {
        parts.push(value);
      } else {
        let useText: string | false = false;
        if (answerCards && previewIndex < answerCards.length) {
          const card = answerCards[previewIndex];
          if (card) {
            useText = card.value;
          }
          previewIndex += 1;
        }
        parts.push(
          useText ? (
            <Typography
              component="span"
              key={`prompt_blank_at_${index}`}
              sx={{ color: answerColor, textDecoration: "underline" }}
            >
              {useText}
            </Typography>
          ) : (
            Array(10).fill("_").join("")
          ),
        );
      }
      parts.push(" ");
    });
    return parts;
  }, [isPrompt, card.value, answerType, answerCards]);

  const badgeContent = useMemo(() => {
    let output = null;
    if (selected) {
      output = " ";
      if (typeof selected === "number") {
        output = selected;
      }
    }
    return output;
  }, [selected]);

  return (
    <Badge
      color="info"
      badgeContent={badgeContent}
      sx={{ display: "block", maxWidth: "100%" }}
    >
      <Card
        sx={{
          backgroundColor: isPrompt ? "black" : "white",
          color: isPrompt ? "white" : "black",
        }}
        onClick={onClick}
      >
        <CardContent>
          <Typography variant="h5" component="div">
            {displayText}
          </Typography>
        </CardContent>
      </Card>
    </Badge>
  );
};

export default DisplayCard;
