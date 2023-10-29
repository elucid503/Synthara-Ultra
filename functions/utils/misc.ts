export function GenerateRandomID(chars = 15): string { 

    const Characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let ID = "";

    for (let i = 0; i < chars; i++) { 

        ID += Characters[Math.floor(Math.random() * Characters.length)];

    }

    return ID;

} 