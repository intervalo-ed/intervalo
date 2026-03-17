from fastapi import FastAPI


app = FastAPI(title="Gradus Backend")


@app.get("/health")
def health_check():
    return {"status": "ok"}

