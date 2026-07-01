from fastapi import FastAPI

app = FastAPI(title="Convention Partnership API")

@app.get("/")
def root():
    return {"message": "API Convention Partnership — UM5"}