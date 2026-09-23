import api from "../api/api";

export type LoginResult = {
  patient: any;
  account: any;
};

type ApiError = Error & { status?: number; body?: any };

const buildApiError = ({
  status,
  body,
  fallback,
}: {
  status?: number;
  body?: any;
  fallback: string;
}): ApiError => {
  const message = body?.msg || body?.message || fallback;
  const err = new Error(message) as ApiError;
  const numericStatus = Number(status);
  if (Number.isFinite(numericStatus)) err.status = numericStatus;
  if (body !== undefined) err.body = body;
  return err;
};

/*
OLD IMPLEMENTATION:
export const loginWithEmailAndPassword = async (params: {
  email: string;
  password: string;
}): Promise<LoginResult> => {
  const { email, password } = params;

  if (!email?.trim()) throw new Error("Missing email.");
  if (!password) throw new Error("Missing password.");

  let res;
  try {
    res = await api.get(`sleep_easy_app/login_with_email_and_password.php`, {
      params: { email, password },
    });
  } catch (error: any) {
    const status =
      error?.response?.data?.status ??
      error?.response?.status ??
      error?.status;
    const body = error?.response?.data;
    throw buildApiError({
      status,
      body,
      fallback: error?.message || "Login failed.",
    });
  }

  const body = res?.data ?? {};
  const status = Number(body?.status ?? res.status);

  if (res.status >= 200 && res.status < 300 && status === 200) {
    return {
      patient: body?.patient ?? body?.data?.patient,
      account: body?.account ?? body?.data?.account,
    };
  }

  throw buildApiError({
    status,
    body,
    fallback: "Login failed.",
  });
};
*/

/**
 * MODIFICATION: Enhanced loginWithEmailAndPassword to provide better error diagnostics
 * when backend network connection fails (e.g. cleartext/IP errors) and to support flexible
 * response data formats (patient_id, id, patient_data). Old code preserved in comments above.
 */
export const loginWithEmailAndPassword = async (params: {
  email: string;
  password: string;
}): Promise<LoginResult> => {
  const { email, password } = params;

  if (!email?.trim()) throw new Error("Missing email.");
  if (!password) throw new Error("Missing password.");

  let res;
  try {
    res = await api.get(`sleep_easy_app/login_with_email_and_password.php`, {
      params: { email: email.trim(), password },
    });
  } catch (error: any) {
    if (
      error?.code === "ERR_NETWORK" ||
      error?.message?.includes("Network Error")
    ) {
      const url = api.defaults.baseURL || "server";
      throw new Error(
        `Cannot connect to server at ${url}.\n\n` +
          `Please verify:\n` +
          `1. Server is running\n` +
          `2. IP address in .env is correct\n` +
          `3. Device/emulator can reach host network`
      );
    }

    const status =
      error?.response?.data?.status ??
      error?.response?.status ??
      error?.status;
    const body = error?.response?.data;
    throw buildApiError({
      status,
      body,
      fallback: error?.message || "Login failed.",
    });
  }

  const body = res?.data ?? {};
  const status = Number(body?.status ?? res.status);

  if (res.status >= 200 && res.status < 300 && (status === 200 || body?.success === true)) {
    const patient = body?.patient ?? body?.data?.patient ?? body?.patient_data;
    const account = body?.account ?? body?.data?.account;

    const patientId =
      patient?.patient_id ??
      patient?.id ??
      body?.patient_id ??
      body?.patientId;

    if (!patientId) {
      const msg =
        body?.msg ||
        body?.message ||
        "Login succeeded, but no valid patient ID was returned from the server.";
      throw new Error(msg);
    }

    return {
      patient: patient ? { ...patient, patient_id: patientId } : { patient_id: patientId },
      account,
    };
  }

  const errorMsg =
    body?.msg ||
    body?.message ||
    `Login failed (status ${status || res.status}). Please check your email and password.`;

  throw buildApiError({
    status,
    body,
    fallback: errorMsg,
  });
};

export const validateLoginDetails = loginWithEmailAndPassword;

export type CreateAccountResult = {
  account_id: number;
  patient_id: number;
};

export const createAccountWithEmailAndPassword = async (params: {
  email: string;
  password: string;
}): Promise<CreateAccountResult> => {
  const { email, password } = params;

  if (!email?.trim()) throw new Error("Missing email.");
  if (!password) throw new Error("Missing password.");

  const payload = new FormData();
  payload.append("email", email.trim());
  payload.append("password", password);

  let res;
  try {
    res = await api.post(
      `sleep_easy_app/create_account_with_email.php`,
      payload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  } catch (error: any) {
    const status =
      error?.response?.data?.status ??
      error?.response?.status ??
      error?.status;
    const body = error?.response?.data;
    throw buildApiError({
      status,
      body,
      fallback: error?.message || "Create account failed.",
    });
  }

  const body = res?.data ?? {};
  const status = Number(body?.status ?? res.status);

  if (res.status >= 200 && res.status < 300 && status === 200) {
    return {
      account_id: Number(body?.account_id ?? body?.data?.account_id),
      patient_id: Number(body?.patient_id ?? body?.data?.patient_id),
    };
  }

  throw buildApiError({
    status,
    body,
    fallback: "Create account failed.",
  });
};
