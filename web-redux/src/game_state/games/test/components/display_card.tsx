import { PromptCard, AnswerCard, CardTypeKeys } from "../../../../game_definition";

import {Card, CardContent, Typography} from "@mui/material";

const DisplayCard = ({card, answerCards, answerType, onClick}: {card: PromptCard | AnswerCard, answerCards?: Array<AnswerCard | false>, answerType?: "preview" | "confirmed", onClick?: React.MouseEventHandler<HTMLElement>}) => {
    const isPrompt = card.type === CardTypeKeys.PROMPT;

    let displayText = !isPrompt && card.value;
    // prompt cards can display special with 
    if (isPrompt) {
        displayText = [];
        let previewIndex = 0;
        let answerColor: string | undefined = undefined;

        switch(answerType) {
            case "preview":
                answerColor = "warning.light";
                break;
            case "confirmed":
                answerColor = "info.light";
                break;
        }


        (card.value as Array<string | false>).forEach((value, index) => {
            if (value) {
                displayText.push(value)
            } else {
                let useText: string | false = false;
                if (answerCards && previewIndex < answerCards.length) {
                    const card = answerCards[previewIndex];
                    if (card) {
                        useText = card.value;
                    }
                    previewIndex += 1;
                    
                }
                displayText.push(useText ? <Typography component="span" key={`prompt_blank_at_${index}`} sx={{color: answerColor, textDecoration: "underline"}}>{useText}</Typography>: Array(10).fill("_").join(""));               
            }
            displayText.push(" ")
        })
    }

    return <Card sx={{backgroundColor: isPrompt ? "black" : "white", color: isPrompt ? "white": "black"}} onClick={onClick}>
        <CardContent>
            <Typography variant="h5" component="div">
                {
                   displayText
                }
            </Typography>
        </CardContent>
    </Card>
}

export default DisplayCard;