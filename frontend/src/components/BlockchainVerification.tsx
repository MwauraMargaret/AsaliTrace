import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, CheckCircle2, Wallet } from "lucide-react";
import { useWeb3 } from "@/contexts/Web3Context";
import { useEffect, useState } from "react";
import { useBlockchain } from "@/hooks/useBlockchain";

interface BlockchainVerificationProps {
  batchNumber?: string;
}

const BlockchainVerification = ({ batchNumber = "HT-2025-VT-10150234" }: BlockchainVerificationProps) => {
  const { isConnected, account, connectWallet } = useWeb3();
  const { getBatchFromChain } = useBlockchain();
  const [blockchainData, setBlockchainData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && batchNumber) {
      loadBlockchainData();
    }
  }, [isConnected, batchNumber]);

  const loadBlockchainData = async () => {
    setLoading(true);
    const data = await getBatchFromChain(batchNumber);
    if (data) {
      setBlockchainData(data);
    }
    setLoading(false);
  };

  const contractAddress = import.meta.env.VITE_HONEY_TRACE_CONTRACT || "0x742d...a8f2";

  if (!isConnected) {
    return (
      <Card className="border-accent/30 bg-gradient-to-br from-card to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Blockchain Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Connect your wallet to view blockchain verification data
            </p>
            <Button onClick={connectWallet} variant="honey">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-card to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" />
          Blockchain Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected Wallet */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-1">Connected Wallet</p>
          <code className="text-xs font-mono">
            {account?.slice(0, 6)}...{account?.slice(-4)}
          </code>
        </div>

        {/* Verified Status */}
        <div className="flex items-center gap-2 p-4 bg-accent/10 rounded-xl border border-accent/20">
          <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {blockchainData ? 'Blockchain Verified' : 'Verification Pending'}
            </p>
            <p className="text-xs text-muted-foreground">
              {blockchainData ? 'All records immutable & transparent' : 'Loading blockchain data...'}
            </p>
          </div>
        </div>

        {blockchainData && (
          <>
            {/* Batch Information */}
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Batch ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-3 py-1 rounded-lg flex-1">
                    {blockchainData.batchNumber}
                  </code>
                  <Badge variant="verified">
                    {blockchainData.verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Smart Contract</p>
                <code className="text-sm font-mono bg-muted px-3 py-1 rounded-lg block break-all">
                  {contractAddress}
                </code>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Beekeeper Address</p>
                <code className="text-sm font-mono bg-muted px-3 py-1 rounded-lg block">
                  {blockchainData.beekeeper}
                </code>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Recorded On</p>
                <p className="text-sm bg-muted px-3 py-1 rounded-lg">
                  {blockchainData.timestamp.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Quality Score</p>
                <p className="text-lg font-semibold">{blockchainData.qualityScore}/100</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Purity</p>
                <p className="text-lg font-semibold">{blockchainData.purityPercentage.toFixed(2)}%</p>
              </div>
            </div>
          </>
        )}

        {/* View on Explorer */}
        <Button 
          variant="outline" 
          className="w-full" 
          size="sm"
          onClick={() => window.open(`https://etherscan.io/address/${contractAddress}`, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
          View on Block Explorer
        </Button>

        <p className="text-xs text-center text-muted-foreground pt-2">
          Every step of this honey's journey is recorded on the blockchain, 
          ensuring complete transparency and authenticity.
        </p>
      </CardContent>
    </Card>
  );
};

export default BlockchainVerification;
