from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from routers.data import router as data_router
from routers.solver import router as solver_router


app = FastAPI()

@app.exception_handler(Exception)
async def handle_exception(request: Request, exc: Exception):
    import traceback
    content = {
        "errorType": type(exc).__name__,
        "errorMessage": str(exc),
        "stackTrace": traceback.format_exc(),
    }

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=content
    )

app.include_router(data_router)
app.include_router(solver_router)
