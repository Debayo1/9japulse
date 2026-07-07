/**
 * Detects the Nigerian mobile network provider based on phone number prefixes.
 * Supports local 0-prefix (e.g. 0803...) and international 234-prefix (e.g. 234803... or +234803...).
 */
export function detectNetworkPrefix(phoneNumber: string): string | null {
  // Remove all non-numeric characters
  let clean = phoneNumber.replace(/[^0-9]/g, "");

  // Convert 234 prefix to local 0 prefix
  if (clean.startsWith("234") && clean.length > 3) {
    clean = "0" + clean.slice(3);
  }

  if (clean.length < 4) return null;

  const prefix4 = clean.slice(0, 4);
  const prefix5 = clean.slice(0, 5); // for MTN 07025, 07026

  const mtnPrefixes = [
    "0803", "0806", "0810", "0813", "0814", "0816",
    "0903", "0906", "0913", "0916", "0703", "0706",
    "0704", "07025", "07026"
  ];
  const airtelPrefixes = [
    "0802", "0808", "0812", "0701", "0708", "0902", "0907", "0901", "0912", "0917"
  ];
  const gloPrefixes = [
    "0805", "0807", "0811", "0815", "0705", "0905", "0915"
  ];
  const nineMobilePrefixes = [
    "0809", "0817", "0818", "0908", "0909"
  ];

  if (mtnPrefixes.includes(prefix4) || mtnPrefixes.includes(prefix5)) return "mtn";
  if (airtelPrefixes.includes(prefix4)) return "airtel";
  if (gloPrefixes.includes(prefix4)) return "glo";
  if (nineMobilePrefixes.includes(prefix4)) return "9mobile";

  return null;
}
