export async function retry(fn, retries = 3, delay = 2000) {

    for (let i = 0; i < retries; i++) {

        try {
            return await fn();
        } catch (err) {

            if (err.status !== 503 || i === retries - 1) {
                throw err;
            }

            console.log(`Retry ${i + 1}/${retries}...`);

            await new Promise(resolve =>
                setTimeout(resolve, delay)
            );
        }
    }
}