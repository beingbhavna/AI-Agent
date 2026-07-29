export default class CalculatorTool {

    getDefinition() {

        return {

            name: "calculator",

            description: "Perform mathematical calculations.",

            parameters: {

                type: "OBJECT",

                properties: {

                    expression: {

                        type: "STRING",

                        description: "Math expression"

                    }

                },

                required: ["expression"]

            }

        }

    }

    execute(expression){

        try{

            return Function(
                `"use strict"; return (${expression})`
            )();

        }

        catch{

            return "Invalid Expression";

        }

    }

}