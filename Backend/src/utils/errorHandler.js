
export const handleServerError = (res, error) => {
    console.log(error);
    return res.status(500).json({ message: "Server Error" });
};
