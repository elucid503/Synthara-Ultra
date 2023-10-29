import { MessageComponentHandlerData } from "../../internals/structs/handlers/components";

export default <MessageComponentHandlerData>{
    
    Group: "Notifications",
    Args: 1,

    Restrictions: {

        Developer: false
        
    },

    RateLimit: null,

    Components: [

        {

            ID: "previous",

            Executable: async () => {

                console.log("Previous page ran!");

            }

        },

        {

            ID: "next",

            Executable: async () => {

                console.log("Next page ran!");

            }

        }  

    ]


};