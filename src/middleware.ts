import { NextResponse, type NextRequest } from "next/server";

// Penjaga ringan di edge: hanya memeriksa keberadaan cookie sesi.
// Verifikasi tanda tangan HMAC + status anggota dilakukan di layout
// dashboard & di setiap route API (getCurrentMember).
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("asinan_session");
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/batch/:path*", "/piutang", "/kas", "/pelanggan", "/pengaturan"],
};
